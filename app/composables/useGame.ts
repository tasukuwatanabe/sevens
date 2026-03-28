import type { Card, NormalCard, GameState, GameStatusCode } from "@/types/game";
import { initGame, placeCard, placeJoker, placeJokerWithCard, passTurn } from "@/game/state";
import { decideCpuAction } from "@/game/cpu";
import {
  getValidCards,
  canPass,
  getValidJokerPositions,
  getJokerWithCardOptions,
} from "@/game/rules";
import type { JokerWithCardOption } from "@/game/rules";
import { isJokerCard, areCardsEqual } from "@/utils/card";
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
  const selectedJokerPos = ref<NormalCard | null>(null);
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
  // コンボ出しの候補一覧（ジョーカー位置選択中のみ算出）
  const jokerComboOptions = computed<JokerWithCardOption[]>(() =>
    isHumanTurn.value && humanHasJoker.value
      ? getJokerWithCardOptions(currentPlayer.value.hand, state.value.board)
      : [],
  );
  // 選択中のジョーカー位置に対応するコンボ候補
  const selectedJokerComboOption = computed<JokerWithCardOption | null>(() => {
    if (!selectedJokerPos.value) return null;
    return (
      jokerComboOptions.value.find(
        (opt) =>
          opt.jokerPos.suit === selectedJokerPos.value!.suit &&
          opt.jokerPos.rank === selectedJokerPos.value!.rank,
      ) ?? null
    );
  });
  // コンボ選択モード中にボード上でハイライトする位置（jokerPos + companionCard）
  const comboHighlightPositions = computed<NormalCard[]>(() => {
    if (!selectedJokerPos.value || !selectedJokerComboOption.value) return [];
    return [selectedJokerPos.value, selectedJokerComboOption.value.companionCard];
  });
  // 第2段階（コンボ可否選択）ではジョーカー位置のクリックは不要になるので非表示にする
  const validJokerPositions = computed<NormalCard[]>(() =>
    jokerMode.value && !selectedJokerPos.value ? getValidJokerPositions(state.value.board) : [],
  );
  const gameStatus = computed((): GameStatusCode => {
    if (cpuThinking.value) return "cpu-thinking";
    if (isHumanTurn.value) {
      if (jokerMode.value) {
        if (selectedJokerPos.value) return "human-joker-combo-select";
        return "human-joker-mode";
      }
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
    selectedJokerPos.value = null;
    state.value = initGame();
  }

  function enterJokerMode() {
    if (!isHumanTurn.value || !humanHasJoker.value) return;
    jokerMode.value = true;
  }

  function cancelJokerMode() {
    if (selectedJokerPos.value) {
      // 第2段階（コンボ可否選択）から第1段階（位置選択）に戻る
      selectedJokerPos.value = null;
    } else {
      jokerMode.value = false;
    }
  }

  function placeJokerAtPosition(pos: NormalCard) {
    if (!isHumanTurn.value || !jokerMode.value) return;
    const comboOption = jokerComboOptions.value.find(
      (opt) => opt.jokerPos.suit === pos.suit && opt.jokerPos.rank === pos.rank,
    );
    if (comboOption) {
      // コンボ可能な位置を選んだ場合は第2段階へ進む
      selectedJokerPos.value = pos;
    } else {
      jokerMode.value = false;
      state.value = placeJoker(state.value, pos);
    }
  }

  function confirmJokerCombo() {
    if (!selectedJokerComboOption.value || !isHumanTurn.value) return;
    const { jokerPos, companionCard } = selectedJokerComboOption.value;
    jokerMode.value = false;
    selectedJokerPos.value = null;
    state.value = placeJokerWithCard(state.value, jokerPos, companionCard);
  }

  function confirmJokerAlone() {
    if (!selectedJokerPos.value || !isHumanTurn.value) return;
    const pos = selectedJokerPos.value;
    jokerMode.value = false;
    selectedJokerPos.value = null;
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
      } else if (action.type === "place-joker-with-card") {
        state.value = placeJokerWithCard(state.value, action.jokerPos, action.companionCard);
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
    selectedJokerPos,
    validJokerPositions,
    jokerComboOptions,
    selectedJokerComboOption,
    comboHighlightPositions,
    showJokerNotification,
    playCard,
    pass,
    resetGame,
    enterJokerMode,
    cancelJokerMode,
    placeJokerAtPosition,
    confirmJokerCombo,
    confirmJokerAlone,
    dismissJokerNotification,
  };
}
