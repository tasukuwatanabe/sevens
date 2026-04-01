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
} from "../../app/game/state";
import { decideCpuAction } from "../../app/game/cpu";
import { isValidPlay, getValidJokerPositions, canPass } from "../../app/game/rules";
import { isJokerCard } from "../../app/utils/card";

const TURN_TIMEOUT_MS = 60_000;
const CPU_DELAY_MS = 800;
const PLAYER_IDS: PlayerId[] = ["human", "cpu1", "cpu2", "cpu3"];

interface SessionMeta {
  seatIndex: SeatIndex;
  sessionToken: string;
}

interface Session extends SessionMeta {
  ws: WebSocket;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function createEmptySeats(): SeatInfo[] {
  return [0, 1, 2, 3].map((i) => ({
    index: i as SeatIndex,
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
    const msg = JSON.parse(rawMsg as string) as ClientMessage;
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
      room.game = passTurn(room.game);
      await this.saveAndBroadcast(room);
      await this.runCpuTurnLoop(room);
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

    // First human to join sets the roomId from the DO name
    if (!room.roomId || room.roomId === "UNKNOWN") {
      // Extract from the URL path used to access this DO
    }

    const meta: SessionMeta = { seatIndex: emptySeat.index, sessionToken };
    const session: Session = { ...meta, ws };
    this.sessions.set(ws, session);
    ws.serializeAttachment(meta);

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
    // Find existing session with this token
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

    const seat = room.seats[seatIndex];
    if (!seat) {
      this.sendError(ws, "INVALID_SEAT", "無効な席番号です");
      return;
    }

    seat.status = "human";
    seat.isConnected = true;

    const meta: SessionMeta = { seatIndex, sessionToken };
    const session: Session = { ...meta, ws };
    this.sessions.set(ws, session);
    ws.serializeAttachment(meta);

    if (room.game) {
      room.game.players[seatIndex]!.type = "human";
    }

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

        await sleep(CPU_DELAY_MS);

        const player = room.game.players[room.game.currentPlayerIndex]!;
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
