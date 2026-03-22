import type { Card, GameState, GameStatusCode } from "@/types/game";
import { initGame, placeCard, passTurn } from "@/game/state";
import { decideCpuAction } from "@/game/cpu";
import { getValidCards, canPass } from "@/game/rules";
import { useLocalStorage } from "./useLocalStorage";
import { CPU_THINK_MS } from "@/game/constants";

const STORAGE_KEY = "sevens-game-state";

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export function useGame() {
  const state = useLocalStorage<GameState>(STORAGE_KEY, initGame());
  const cpuThinking = ref(false);

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
  const gameStatus = computed((): GameStatusCode => {
    if (cpuThinking.value) return "cpu-thinking";
    if (isHumanTurn.value) {
      if (validCards.value.length > 0) return "human-place";
      if (canPassTurn.value) return "human-must-pass";
      return "human-turn";
    }
    return "cpu-turn";
  });

  function playCard(card: Card) {
    if (!isHumanTurn.value) return;
    state.value = placeCard(state.value, card);
  }

  function pass() {
    if (!isHumanTurn.value || !canPassTurn.value) return;
    state.value = passTurn(state.value);
  }

  function resetGame() {
    state.value = initGame();
  }

  async function executeCpuTurn() {
    const s = state.value;
    if (s.phase !== "playing") return;

    const player = s.players[s.currentPlayerIndex]!;
    if (player.type !== "cpu") return;

    cpuThinking.value = true;
    await sleep(CPU_THINK_MS);

    const action = decideCpuAction(player, state.value.board);
    if (action.type === "place") {
      state.value = placeCard(state.value, action.card);
    } else {
      state.value = passTurn(state.value);
    }
    cpuThinking.value = false;
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

  return {
    state,
    currentPlayer,
    isHumanTurn,
    validCards,
    canPassTurn,
    cpuThinking,
    cpuPlayers,
    humanPlayer,
    gameStatus,
    playCard,
    pass,
    resetGame,
  };
}
