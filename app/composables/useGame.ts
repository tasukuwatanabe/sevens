import type { Card, GameState } from "../types/game";
import { initGame, placeCard, passTurn } from "../../game/state";
import { decideCpuAction } from "../../game/cpu";
import { getValidCards, canPass } from "../../game/rules";
import { useLocalStorage } from "./useLocalStorage";

const STORAGE_KEY = "sevens-game-state";
const CPU_THINK_MS = 1500;

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
  const statusMessage = computed(() => {
    if (cpuThinking.value) return `${currentPlayer.value.name}が考え中…`;
    if (isHumanTurn.value) {
      if (validCards.value.length > 0) return "カードを選んで置いてください";
      if (canPassTurn.value) return "置けるカードがありません。パスしてください";
      return "あなたのターン";
    }
    return `${currentPlayer.value.name}のターン`;
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
    statusMessage,
    playCard,
    pass,
    resetGame,
  };
}
