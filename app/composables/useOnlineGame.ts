import type { Card, NormalCard, GameStatusCode } from "@/types/game";
import type { ClientMessage, ClientRoomView, SeatIndex, ServerMessage } from "@/types/online";
import { getValidCards, getValidJokerPositions, getJokerWithCardOptions } from "@/game/rules";
import type { JokerWithCardOption } from "@/game/rules";
import { isJokerCard, areCardsEqual } from "@/utils/card";
import { MAX_PASSES } from "@/game/constants";

const SESSION_KEY = "sevens-online-session";

interface StoredSession {
  roomId: string;
  sessionToken: string;
  seatIndex: SeatIndex;
}

export function useOnlineGame(roomId: string) {
  const room = ref<ClientRoomView | null>(null);
  const connected = ref(false);
  const error = ref<string | null>(null);
  const jokerMode = ref(false);
  const selectedJokerPos = ref<NormalCard | null>(null);
  const showJokerNotification = ref(false);

  let ws: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  const myHand = computed(() => room.value?.game?.myHand ?? []);
  const board = computed(() => room.value?.game?.board ?? null);
  const isMyTurn = computed(() => {
    if (!room.value?.game || room.value.mySeatIndex === null) return false;
    return room.value.game.currentSeatIndex === room.value.mySeatIndex;
  });
  const validCards = computed(() => {
    if (!isMyTurn.value || !board.value) return [];
    return getValidCards(myHand.value, board.value);
  });
  const canPassTurn = computed(() => {
    if (!isMyTurn.value || !room.value?.game || room.value.mySeatIndex === null) return false;
    const passesUsed = room.value.game.passesUsed[room.value.mySeatIndex] ?? 0;
    return passesUsed < MAX_PASSES && validCards.value.length === 0;
  });
  const humanHasJoker = computed(() => myHand.value.some(isJokerCard));
  const jokerComboOptions = computed<JokerWithCardOption[]>(() => {
    if (!isMyTurn.value || !humanHasJoker.value || !board.value) return [];
    return getJokerWithCardOptions(myHand.value, board.value);
  });
  const selectedJokerComboOption = computed<JokerWithCardOption | null>(() => {
    const pos = selectedJokerPos.value;
    if (!pos) return null;
    return jokerComboOptions.value.find((opt) => areCardsEqual(opt.jokerPos, pos)) ?? null;
  });
  const comboHighlightPositions = computed<NormalCard[]>(() => {
    if (!selectedJokerPos.value || !selectedJokerComboOption.value) return [];
    return [selectedJokerPos.value, selectedJokerComboOption.value.companionCard];
  });
  const validJokerPositions = computed<NormalCard[]>(() => {
    if (!jokerMode.value || selectedJokerPos.value || !board.value) return [];
    return getValidJokerPositions(board.value);
  });
  const currentSeatIndex = computed(() => room.value?.game?.currentSeatIndex ?? null);
  const gameStatus = computed((): GameStatusCode | "waiting" | "online-other-turn" => {
    if (!room.value || room.value.phase === "waiting") return "waiting";
    if (!isMyTurn.value) return "online-other-turn";
    if (jokerMode.value) {
      if (selectedJokerPos.value) return "human-joker-combo-select";
      return "human-joker-mode";
    }
    if (validCards.value.length > 0) return "human-place";
    if (humanHasJoker.value && canPassTurn.value) return "human-joker-or-pass";
    if (canPassTurn.value) return "human-must-pass";
    return "human-turn";
  });
  const turnTimeRemaining = ref<number | null>(null);
  let turnTimerInterval: ReturnType<typeof setInterval> | null = null;

  function updateTurnTimer() {
    if (turnTimerInterval) {
      clearInterval(turnTimerInterval);
      turnTimerInterval = null;
    }
    if (!room.value?.turnDeadline) {
      turnTimeRemaining.value = null;
      return;
    }
    const update = () => {
      const remaining = Math.max(0, (room.value?.turnDeadline ?? 0) - Date.now());
      turnTimeRemaining.value = Math.ceil(remaining / 1000);
    };
    update();
    turnTimerInterval = setInterval(update, 1000);
  }

  function send(msg: ClientMessage) {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }

  function connect(playerName?: string) {
    const config = useRuntimeConfig();
    const workerUrl = config.public.workerUrl as string;
    let wsUrl: string;
    if (workerUrl) {
      const base = workerUrl.replace(/^http/, "ws");
      wsUrl = `${base}/api/rooms/${roomId}/ws`;
    } else {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      wsUrl = `${protocol}//${window.location.host}/api/rooms/${roomId}/ws`;
    }
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      connected.value = true;
      error.value = null;

      const stored = loadSession();
      if (stored && stored.roomId === roomId) {
        send({ type: "rejoin", sessionToken: stored.sessionToken, seatIndex: stored.seatIndex });
      } else if (playerName) {
        send({ type: "join", playerName });
      }
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data) as ServerMessage & { sessionToken?: string };
      if (msg.type === "room-state") {
        const prevHand = room.value?.game?.myHand;
        room.value = msg.room;
        updateTurnTimer();

        if (msg.sessionToken && msg.room.mySeatIndex !== null) {
          saveSession({
            roomId,
            sessionToken: msg.sessionToken,
            seatIndex: msg.room.mySeatIndex,
          });
        }

        if (prevHand && msg.room.game) {
          const hadJoker = prevHand.some(isJokerCard);
          const hasJoker = msg.room.game.myHand.some(isJokerCard);
          if (!hadJoker && hasJoker && msg.room.phase !== "gameover") {
            showJokerNotification.value = true;
          }
        }
      } else if (msg.type === "error") {
        error.value = msg.message;
      }
    };

    ws.onclose = () => {
      connected.value = false;
      reconnectTimer = setTimeout(() => connect(), 3000);
    };

    ws.onerror = () => {
      connected.value = false;
    };
  }

  function disconnect() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (turnTimerInterval) {
      clearInterval(turnTimerInterval);
      turnTimerInterval = null;
    }
    ws?.close();
    ws = null;
  }

  function playCard(card: Card) {
    if (!isMyTurn.value || isJokerCard(card)) return;
    jokerMode.value = false;
    send({ type: "play-card", card: card as NormalCard });
  }

  function pass() {
    if (!isMyTurn.value || !canPassTurn.value) return;
    send({ type: "pass" });
  }

  function startGame() {
    send({ type: "start-game" });
  }

  function enterJokerMode() {
    if (!isMyTurn.value || !humanHasJoker.value) return;
    jokerMode.value = true;
  }

  function cancelJokerMode() {
    if (selectedJokerPos.value) {
      selectedJokerPos.value = null;
    } else {
      jokerMode.value = false;
    }
  }

  function placeJokerAtPosition(pos: NormalCard) {
    if (!isMyTurn.value || !jokerMode.value) return;
    const comboOption = jokerComboOptions.value.find((opt) => areCardsEqual(opt.jokerPos, pos));
    if (comboOption) {
      selectedJokerPos.value = pos;
    } else {
      jokerMode.value = false;
      send({ type: "place-joker", position: pos });
    }
  }

  function confirmJokerCombo() {
    if (!selectedJokerComboOption.value || !isMyTurn.value) return;
    const { jokerPos, companionCard } = selectedJokerComboOption.value;
    jokerMode.value = false;
    selectedJokerPos.value = null;
    send({ type: "place-joker-with-card", jokerPos, companionCard });
  }

  function confirmJokerAlone() {
    if (!selectedJokerPos.value || !isMyTurn.value) return;
    const pos = selectedJokerPos.value;
    jokerMode.value = false;
    selectedJokerPos.value = null;
    send({ type: "place-joker", position: pos });
  }

  function dismissJokerNotification() {
    showJokerNotification.value = false;
  }

  function loadSession(): StoredSession | null {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as StoredSession) : null;
    } catch {
      return null;
    }
  }

  function saveSession(session: StoredSession) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  onMounted(() => {
    // Will be connected by the page after name input
  });

  onUnmounted(() => {
    disconnect();
  });

  return {
    room,
    connected,
    error,
    myHand,
    board,
    isMyTurn,
    validCards,
    canPassTurn,
    humanHasJoker,
    jokerMode,
    selectedJokerPos,
    validJokerPositions,
    jokerComboOptions,
    selectedJokerComboOption,
    comboHighlightPositions,
    showJokerNotification,
    currentSeatIndex,
    gameStatus,
    turnTimeRemaining,
    connect,
    disconnect,
    send,
    playCard,
    pass,
    startGame,
    enterJokerMode,
    cancelJokerMode,
    placeJokerAtPosition,
    confirmJokerCombo,
    confirmJokerAlone,
    dismissJokerNotification,
  };
}
