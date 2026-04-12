import type { GameState, Player, PlayerId } from "../../app/types/game";
import type {
  SeatIndex,
  SeatInfo,
  RoomState,
  ClientMessage,
  ClientRoomView,
  ClientGameView,
} from "../../app/types/online";
import {
  initGame,
  placeCard,
  placeJoker,
  placeJokerWithCard,
  passTurn,
  eliminatePlayer,
} from "../../app/game/state";
import { decideCpuAction } from "../../app/game/cpu";
import {
  isValidPlay,
  getValidCards,
  getValidJokerPositions,
  getJokerWithCardOptions,
  canPass,
  shouldEliminate,
} from "../../app/game/rules";
import { isJokerCard, areCardsEqual } from "../../app/utils/card";
import { sleep } from "../../app/utils/helpers";
import { TURN_TIMEOUT_MS, CPU_DELAY_MS } from "../../app/game/constants";

const PLAYER_IDS: PlayerId[] = ["human", "cpu1", "cpu2", "cpu3"];

interface SessionMeta {
  seatIndex: SeatIndex;
  sessionToken: string;
}

interface Session extends SessionMeta {
  ws: WebSocket;
}

function createEmptySeats(): SeatInfo[] {
  const SEAT_INDICES = [0, 1, 2, 3] as const;
  return SEAT_INDICES.map((i) => ({
    index: i,
    status: "empty" as const,
    playerName: null,
    isConnected: false,
  }));
}

function createRoom(roomId: string): RoomState {
  return {
    roomId,
    phase: "waiting",
    seats: createEmptySeats(),
    hostSeatIndex: 0 as SeatIndex,
    game: null,
    turnDeadline: null,
    createdAt: Date.now(),
  };
}

function initGameForRoom(seats: SeatInfo[]): GameState {
  const base = initGame();
  const players: Player[] = seats.map((seat, i) => ({
    ...base.players[i]!,
    id: PLAYER_IDS[i]!,
    type: seat.status === "human" ? ("human" as const) : ("cpu" as const),
    name: seat.playerName ?? `CPU ${i}`,
    eliminated: false,
  }));
  return { ...base, players };
}

export class GameRoom implements DurableObject {
  private state: DurableObjectState;
  private sessions: Map<WebSocket, Session> = new Map();
  private room: RoomState | null = null;
  private cpuLoopRunning = false;
  private roomId = "UNKNOWN";

  constructor(state: DurableObjectState) {
    this.state = state;
    this.state.getWebSockets().forEach((ws) => {
      const meta = ws.deserializeAttachment() as SessionMeta | null;
      if (meta) {
        this.sessions.set(ws, { ...meta, ws });
      }
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const match = url.pathname.match(/\/api\/rooms\/([A-Z0-9]+)\/ws/);
    if (match) {
      this.roomId = match[1]!;
    }

    const upgradeHeader = request.headers.get("Upgrade");
    if (!upgradeHeader || upgradeHeader !== "websocket") {
      return new Response("Expected WebSocket", { status: 426 });
    }

    const pair = new WebSocketPair();
    this.state.acceptWebSocket(pair[1]);

    return new Response(null, { status: 101, webSocket: pair[0] });
  }

  async webSocketMessage(ws: WebSocket, rawMsg: string | ArrayBuffer): Promise<void> {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(rawMsg as string) as ClientMessage;
    } catch {
      this.sendError(ws, "INVALID_MESSAGE", "不正なメッセージです");
      return;
    }
    const room = await this.loadRoom();

    switch (msg.type) {
      case "join":
        await this.handleJoin(ws, msg.playerName, room);
        break;
      case "rejoin":
        await this.handleRejoin(ws, msg.sessionToken, msg.seatIndex, room);
        break;
      case "start-game":
        await this.handleStartGame(ws, room);
        break;
      case "play-card":
      case "pass":
      case "place-joker":
      case "place-joker-with-card":
        await this.handleGameAction(ws, msg, room);
        break;
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    const session = this.sessions.get(ws);
    this.sessions.delete(ws);
    if (!session) return;

    const room = await this.loadRoom();

    if (room.phase === "waiting" && session.seatIndex === room.hostSeatIndex) {
      room.phase = "destroyed";
      await this.saveAndBroadcast(room);
      return;
    }

    const seat = room.seats[session.seatIndex];
    if (seat) {
      seat.isConnected = false;
      if (room.phase === "playing") {
        seat.status = "cpu";
      }
    }

    await this.saveAndBroadcast(room);

    if (
      room.phase === "playing" &&
      room.game &&
      room.game.currentPlayerIndex === session.seatIndex
    ) {
      await this.runCpuTurnLoop(room);
    }
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    await this.webSocketClose(ws);
  }

  async alarm(): Promise<void> {
    const room = await this.loadRoom();
    if (room.phase !== "playing" || !room.game) return;

    const currentSeat = room.seats[room.game.currentPlayerIndex];
    if (currentSeat?.status === "human") {
      const player = room.game.players[room.game.currentPlayerIndex]!;
      if (shouldEliminate(player, room.game.board)) {
        room.game = eliminatePlayer(room.game);
      } else {
        room.game = passTurn(room.game);
      }

      if (room.game.phase === "gameover") {
        room.phase = "gameover";
        room.turnDeadline = null;
        await this.state.storage.deleteAlarm();
      }

      await this.saveAndBroadcast(room);
      if (room.phase === "playing") {
        await this.runCpuTurnLoop(room);
      }
    }
  }

  private async loadRoom(): Promise<RoomState> {
    if (this.room) return this.room;
    const stored = await this.state.storage.get<RoomState>("room");
    if (stored) {
      this.room = stored;
      return stored;
    }
    const room = createRoom(this.roomId);
    this.room = room;
    return room;
  }

  private async saveAndBroadcast(room: RoomState): Promise<void> {
    this.room = room;
    await this.state.storage.put("room", room);

    for (const [ws, session] of this.sessions) {
      try {
        const view = this.buildClientView(room, session);
        ws.send(JSON.stringify({ type: "room-state", room: view }));
      } catch {
        // connection may be stale
      }
    }
  }

  private buildClientView(room: RoomState, session: Session): ClientRoomView {
    let game: ClientGameView | null = null;
    if (room.game) {
      const g = room.game;
      const myPlayer = g.players[session.seatIndex];
      game = {
        board: g.board,
        currentSeatIndex: g.currentPlayerIndex as SeatIndex,
        myHand: myPlayer?.hand ?? [],
        handCounts: g.players.map((p) => p.hand.length),
        passesUsed: g.players.map((p) => p.passesUsed),
        eliminated: g.players.map((p) => p.eliminated),
        winner: g.winner ? (g.players.findIndex((p) => p.id === g.winner) as SeatIndex) : null,
      };
    }

    return {
      roomId: room.roomId,
      phase: room.phase,
      seats: room.seats,
      mySeatIndex: session.seatIndex,
      isHost: session.seatIndex === room.hostSeatIndex,
      game,
      turnDeadline: room.turnDeadline,
    };
  }

  private sendError(ws: WebSocket, code: string, message: string): void {
    ws.send(JSON.stringify({ type: "error", code, message }));
  }

  private async handleJoin(ws: WebSocket, playerName: string, room: RoomState): Promise<void> {
    if (
      typeof playerName !== "string" ||
      playerName.trim().length === 0 ||
      playerName.length > 50
    ) {
      this.sendError(ws, "INVALID_NAME", "名前が無効です（1〜50文字）");
      return;
    }

    if (room.phase === "destroyed") {
      this.sendError(ws, "ROOM_DESTROYED", "このルームは破棄されました");
      return;
    }

    if (room.phase !== "waiting") {
      this.sendError(ws, "GAME_STARTED", "ゲームは既に開始されています");
      return;
    }

    const emptySeat = room.seats.find((s) => s.status === "empty");
    if (!emptySeat) {
      this.sendError(ws, "ROOM_FULL", "ルームが満席です");
      return;
    }

    const sessionToken = crypto.randomUUID();
    emptySeat.status = "human";
    emptySeat.playerName = playerName;
    emptySeat.isConnected = true;

    const meta: SessionMeta = { seatIndex: emptySeat.index, sessionToken };
    const session: Session = { ...meta, ws };
    this.sessions.set(ws, session);
    ws.serializeAttachment(meta);
    await this.state.storage.put(`token:${sessionToken}`, emptySeat.index);

    ws.send(
      JSON.stringify({
        type: "room-state",
        room: this.buildClientView(room, session),
        sessionToken,
      }),
    );

    await this.saveAndBroadcast(room);

    if (room.seats.every((s) => s.status === "human")) {
      await this.startGame(room);
    }
  }

  private async handleRejoin(
    ws: WebSocket,
    sessionToken: string,
    seatIndex: SeatIndex,
    room: RoomState,
  ): Promise<void> {
    const storedSeatIndex = await this.state.storage.get<SeatIndex>(`token:${sessionToken}`);
    if (storedSeatIndex === undefined || storedSeatIndex !== seatIndex) {
      this.sendError(ws, "INVALID_SESSION", "セッションが無効です");
      return;
    }

    for (const [existingWs, existingSession] of this.sessions) {
      if (existingSession.sessionToken === sessionToken) {
        this.sessions.delete(existingWs);
        try {
          existingWs.close(1000, "Replaced by new connection");
        } catch {
          // ignore
        }
        break;
      }
    }

    await this.state.storage.delete(`token:${sessionToken}`);
    const newSessionToken = crypto.randomUUID();
    await this.state.storage.put(`token:${newSessionToken}`, seatIndex);

    const seat = room.seats[seatIndex];
    if (!seat) {
      this.sendError(ws, "INVALID_SEAT", "無効な席番号です");
      return;
    }

    seat.status = "human";
    seat.isConnected = true;

    const meta: SessionMeta = { seatIndex, sessionToken: newSessionToken };
    const session: Session = { ...meta, ws };
    this.sessions.set(ws, session);
    ws.serializeAttachment(meta);

    if (room.game) {
      room.game.players[seatIndex]!.type = "human";
    }

    ws.send(
      JSON.stringify({
        type: "room-state",
        room: this.buildClientView(room, session),
        sessionToken: newSessionToken,
      }),
    );

    await this.saveAndBroadcast(room);
  }

  private async handleStartGame(ws: WebSocket, room: RoomState): Promise<void> {
    const session = this.sessions.get(ws);
    if (!session || session.seatIndex !== room.hostSeatIndex) {
      this.sendError(ws, "NOT_HOST", "ホストのみ開始できます");
      return;
    }

    if (room.phase !== "waiting") {
      this.sendError(ws, "ALREADY_STARTED", "既にゲームが開始されています");
      return;
    }

    const humanCount = room.seats.filter((s) => s.status === "human").length;
    if (humanCount < 1) {
      this.sendError(ws, "NO_PLAYERS", "最低1人のプレイヤーが必要です");
      return;
    }

    // Fill empty seats with CPU
    for (const seat of room.seats) {
      if (seat.status === "empty") {
        seat.status = "cpu";
        seat.playerName = `CPU ${seat.index + 1}`;
      }
    }

    await this.startGame(room);
  }

  private async startGame(room: RoomState): Promise<void> {
    room.phase = "playing";
    room.game = initGameForRoom(room.seats);
    await this.saveAndBroadcast(room);
    await this.runCpuTurnLoop(room);
  }

  private async handleGameAction(
    ws: WebSocket,
    msg: ClientMessage,
    room: RoomState,
  ): Promise<void> {
    const session = this.sessions.get(ws);
    if (!session) return;

    if (room.phase !== "playing" || !room.game) {
      this.sendError(ws, "NOT_PLAYING", "ゲーム中ではありません");
      return;
    }

    if (room.game.currentPlayerIndex !== session.seatIndex) {
      this.sendError(ws, "NOT_YOUR_TURN", "あなたのターンではありません");
      return;
    }

    const player = room.game.players[session.seatIndex]!;

    switch (msg.type) {
      case "play-card": {
        if (!player.hand.some((c) => areCardsEqual(c, msg.card))) {
          this.sendError(ws, "CARD_NOT_IN_HAND", "そのカードは手札にありません");
          return;
        }
        if (!isValidPlay(msg.card, room.game.board)) {
          this.sendError(ws, "INVALID_PLAY", "このカードは出せません");
          return;
        }
        room.game = placeCard(room.game, msg.card);
        break;
      }
      case "pass": {
        if (!canPass(player)) {
          this.sendError(ws, "NO_PASSES", "パスの残り回数がありません");
          return;
        }
        if (getValidCards(player.hand, room.game.board).length > 0) {
          this.sendError(ws, "CANNOT_PASS", "出せるカードがあります");
          return;
        }
        room.game = passTurn(room.game);
        break;
      }
      case "place-joker": {
        if (!player.hand.some(isJokerCard)) {
          this.sendError(ws, "NO_JOKER", "ジョーカーを持っていません");
          return;
        }
        const validPositions = getValidJokerPositions(room.game.board);
        const isValid = validPositions.some(
          (p) => p.suit === msg.position.suit && p.rank === msg.position.rank,
        );
        if (!isValid) {
          this.sendError(ws, "INVALID_JOKER_POS", "この位置にジョーカーは置けません");
          return;
        }
        room.game = placeJoker(room.game, msg.position);
        break;
      }
      case "place-joker-with-card": {
        if (!player.hand.some(isJokerCard)) {
          this.sendError(ws, "NO_JOKER", "ジョーカーを持っていません");
          return;
        }
        const validCombos = getJokerWithCardOptions(player.hand, room.game.board);
        const isValidCombo = validCombos.some(
          (opt) =>
            opt.jokerPos.suit === msg.jokerPos.suit &&
            opt.jokerPos.rank === msg.jokerPos.rank &&
            opt.companionCard.suit === msg.companionCard.suit &&
            opt.companionCard.rank === msg.companionCard.rank,
        );
        if (!isValidCombo) {
          this.sendError(ws, "INVALID_JOKER_COMBO", "この組み合わせは無効です");
          return;
        }
        room.game = placeJokerWithCard(room.game, msg.jokerPos, msg.companionCard);
        break;
      }
    }

    if (room.game.phase === "gameover") {
      room.phase = "gameover";
      room.turnDeadline = null;
      await this.state.storage.deleteAlarm();
    }

    await this.saveAndBroadcast(room);

    if (room.phase === "playing") {
      await this.runCpuTurnLoop(room);
    }
  }

  private async runCpuTurnLoop(room: RoomState): Promise<void> {
    if (this.cpuLoopRunning) return;
    this.cpuLoopRunning = true;

    try {
      while (room.phase === "playing" && room.game) {
        const currentSeat = room.seats[room.game.currentPlayerIndex];
        if (!currentSeat || currentSeat.status !== "cpu") break;

        const player = room.game.players[room.game.currentPlayerIndex]!;
        if (player.eliminated) break;

        await sleep(CPU_DELAY_MS);

        const action = decideCpuAction(player, room.game.board, room.game.players);

        switch (action.type) {
          case "place":
            room.game = placeCard(room.game, action.card);
            break;
          case "place-joker":
            room.game = placeJoker(room.game, action.position);
            break;
          case "place-joker-with-card":
            room.game = placeJokerWithCard(room.game, action.jokerPos, action.companionCard);
            break;
          case "eliminate":
            room.game = eliminatePlayer(room.game);
            break;
          case "pass":
            room.game = passTurn(room.game);
            break;
        }

        if (room.game.phase === "gameover") {
          room.phase = "gameover";
          room.turnDeadline = null;
          await this.state.storage.deleteAlarm();
        }

        await this.saveAndBroadcast(room);
      }

      if (room.phase === "playing" && room.game) {
        room.turnDeadline = Date.now() + TURN_TIMEOUT_MS;
        await this.saveAndBroadcast(room);
        await this.state.storage.setAlarm(Date.now() + TURN_TIMEOUT_MS);
      }
    } finally {
      this.cpuLoopRunning = false;
    }
  }
}
