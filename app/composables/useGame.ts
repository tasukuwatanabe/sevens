import { ref, computed, watch } from "vue";
import type { Card, NormalCard, GameState, GameStatusCode } from "@/types/game";
import {
  initGame,
  placeCard,
  placeJoker,
  placeJokerWithCard,
  passTurn,
  eliminatePlayer,
} from "@/game/state";
import { decideCpuAction } from "@/game/cpu";
import { getValidCards, canPass, shouldEliminate } from "@/game/rules";
import { isJokerCard } from "@/utils/card";
import { sleep } from "@/utils/helpers";
import { useLocalStorage } from "./useLocalStorage";
import { useJokerMode } from "./useJokerMode";
import { CPU_THINK_MS } from "@/game/constants";

const STORAGE_KEY = "sevens-state";

export function useGame() {
  const state = useLocalStorage<GameState>(STORAGE_KEY, initGame());

  // localStorage後方互換: eliminatedが未定義の場合はfalseに設定
  if (state.value.players.some((p) => p.eliminated === undefined)) {
    state.value = {
      ...state.value,
      players: state.value.players.map((p) => ({ ...p, eliminated: p.eliminated ?? false })),
    };
  }

  const cpuThinking = ref(false);
  const thinkingPlayerId = ref<string | null>(null);

  const currentPlayer = computed(() => state.value.players[state.value.currentPlayerIndex]!);
  const isHumanTurn = computed(() => currentPlayer.value.type === "human");
  const humanPlayer = computed(() => state.value.players.find((p) => p.type === "human")!);
  const cpuPlayers = computed(() => state.value.players.filter((p) => p.type === "cpu"));

  const validCards = computed(() =>
    isHumanTurn.value ? getValidCards(currentPlayer.value.hand, state.value.board) : [],
  );
  const canPassTurn = computed(
    () => isHumanTurn.value && canPass(currentPlayer.value) && validCards.value.length === 0,
  );
  const shouldBeEliminated = computed(
    () => isHumanTurn.value && shouldEliminate(currentPlayer.value, state.value.board),
  );

  const joker = useJokerMode({
    isPlayerTurn: isHumanTurn,
    hand: computed(() => humanPlayer.value.hand),
    board: computed(() => state.value.board),
    onPlaceJoker: (pos) => {
      state.value = placeJoker(state.value, pos);
    },
    onPlaceJokerWithCard: (jokerPos, companionCard) => {
      state.value = placeJokerWithCard(state.value, jokerPos, companionCard);
    },
  });

  const gameStatus = computed((): GameStatusCode => {
    if (cpuThinking.value) return "cpu-thinking";
    if (isHumanTurn.value) {
      if (shouldBeEliminated.value) return "human-eliminated";
      if (joker.jokerMode.value) {
        if (joker.selectedJokerPos.value) return "human-joker-combo-select";
        return "human-joker-mode";
      }
      if (validCards.value.length > 0) return "human-place";
      if (joker.humanHasJoker.value && canPassTurn.value) return "human-joker-or-pass";
      if (canPassTurn.value) return "human-must-pass";
      return "human-turn";
    }
    return "cpu-turn";
  });

  function playCard(card: Card) {
    if (!isHumanTurn.value || isJokerCard(card)) return;
    joker.reset();
    state.value = placeCard(state.value, card as NormalCard);
  }

  function pass() {
    if (!isHumanTurn.value || !canPassTurn.value) return;
    state.value = passTurn(state.value);
  }

  function resetGame() {
    joker.reset();
    state.value = initGame();
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
      } else if (action.type === "place-joker-with-card") {
        state.value = placeJokerWithCard(state.value, action.jokerPos, action.companionCard);
      } else if (action.type === "place-joker") {
        state.value = placeJoker(state.value, action.position);
      } else if (action.type === "eliminate") {
        state.value = eliminatePlayer(state.value);
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
    () =>
      humanPlayer.value.hand
        .map((c) => (isJokerCard(c) ? "joker" : `${c.suit}-${c.rank}`))
        .join(","),
    (newKey, oldKey) => {
      if (
        oldKey !== undefined &&
        !oldKey.includes("joker") &&
        newKey.includes("joker") &&
        state.value.phase !== "gameover"
      ) {
        joker.notifyJokerReceived();
      }
    },
  );

  watch(shouldBeEliminated, async (val) => {
    if (val) {
      await sleep(CPU_THINK_MS);
      if (shouldBeEliminated.value) {
        state.value = eliminatePlayer(state.value);
      }
    }
  });

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
    gameStatus,
    ...joker,
    playCard,
    pass,
    resetGame,
  };
}
