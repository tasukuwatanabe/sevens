import type { Card, NormalCard, GameState, GameStatusCode } from "@/types/game";
import { initGame, placeCard, placeJoker, passTurn } from "@/game/state";
import { decideCpuAction } from "@/game/cpu";
import { getValidCards, canPass, getValidJokerPositions } from "@/game/rules";
import { isJokerCard } from "@/utils/card";
import { useLocalStorage } from "./useLocalStorage";
import { CPU_THINK_MS } from "@/game/constants";

const STORAGE_KEY = "sevens-game-state";

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export function useGame() {
  const state = useLocalStorage<GameState>(STORAGE_KEY, initGame());
  const cpuThinking = ref(false);
  const thinkingPlayerId = ref<string | null>(null);
  const jokerMode = ref(false);
  const showJokerNotification = ref(false);

  const currentPlayer = computed(() => state.value.players[state.value.currentPlayerIndex]!);
  const isHumanTurn = computed(() => currentPlayer.value.type === "human");
  const validCards = computed(() =>
    isHumanTurn.value ? getValidCards(currentPlayer.value.hand, state.value.board) : [],
  );
  const canPassTurn = computed(
    () => isHumanTurn.value && canPass(currentPlayer.value) && validCards.value.length === 0,
  );
  const cpuPlayers = computed(() => state.value.players.filter((p) => p.type === "cpu"));
  const humanPlayer = computed(() => state.value.players.find((p) => p.type === "human")!);
  const humanHasJoker = computed(() => humanPlayer.value.hand.some(isJokerCard));
  const validJokerPositions = computed<NormalCard[]>(() =>
    jokerMode.value ? getValidJokerPositions(state.value.board) : [],
  );
  const gameStatus = computed((): GameStatusCode => {
    if (cpuThinking.value) return "cpu-thinking";
    if (isHumanTurn.value) {
      if (jokerMode.value) return "human-joker-mode";
      if (validCards.value.length > 0) return "human-place";
      if (humanHasJoker.value && canPassTurn.value) return "human-joker-or-pass";
      if (canPassTurn.value) return "human-must-pass";
      return "human-turn";
    }
    return "cpu-turn";
  });

  function playCard(card: Card) {
    if (!isHumanTurn.value || isJokerCard(card)) return;
    jokerMode.value = false;
    state.value = placeCard(state.value, card as NormalCard);
  }

  function pass() {
    if (!isHumanTurn.value || !canPassTurn.value) return;
    state.value = passTurn(state.value);
  }

  function resetGame() {
    jokerMode.value = false;
    state.value = initGame();
  }

  function enterJokerMode() {
    if (!isHumanTurn.value || !humanHasJoker.value) return;
    jokerMode.value = true;
  }

  function cancelJokerMode() {
    jokerMode.value = false;
  }

  function placeJokerAtPosition(pos: NormalCard) {
    if (!isHumanTurn.value || !jokerMode.value) return;
    jokerMode.value = false;
    state.value = placeJoker(state.value, pos);
  }

  function dismissJokerNotification() {
    showJokerNotification.value = false;
  }

  async function executeCpuTurn() {
    const s = state.value;
    if (s.phase !== "playing") return;

    const player = s.players[s.currentPlayerIndex]!;
    if (player.type !== "cpu") return;

    cpuThinking.value = true;
    thinkingPlayerId.value = player.id;
    try {
      await sleep(CPU_THINK_MS);
      const action = decideCpuAction(player, state.value.board, state.value.players);
      if (action.type === "place") {
        state.value = placeCard(state.value, action.card);
      } else if (action.type === "place-joker") {
        state.value = placeJoker(state.value, action.position);
      } else {
        state.value = passTurn(state.value);
      }
    } finally {
      cpuThinking.value = false;
      thinkingPlayerId.value = null;
    }
  }

  watch(
    () => state.value.currentPlayerIndex,
    async () => {
      if (state.value.phase === "playing" && currentPlayer.value.type === "cpu") {
        await executeCpuTurn();
      }
    },
    { immediate: true },
  );

  watch(
    () => humanPlayer.value.hand,
    (newHand, oldHand) => {
      const hadJoker = oldHand?.some(isJokerCard) ?? false;
      const hasJoker = newHand.some(isJokerCard);
      // ゲーム終了と同時にジョーカーが転送された場合は演出を出しても意味がない
      if (!hadJoker && hasJoker && state.value.phase !== "gameover") {
        showJokerNotification.value = true;
      }
    },
    { deep: true },
  );

  return {
    state,
    currentPlayer,
    isHumanTurn,
    validCards,
    canPassTurn,
    cpuThinking,
    thinkingPlayerId,
    cpuPlayers,
    humanPlayer,
    humanHasJoker,
    gameStatus,
    jokerMode,
    validJokerPositions,
    showJokerNotification,
    playCard,
    pass,
    resetGame,
    enterJokerMode,
    cancelJokerMode,
    placeJokerAtPosition,
    dismissJokerNotification,
  };
}
