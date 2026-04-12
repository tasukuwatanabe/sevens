import { ref, computed, type ComputedRef } from "vue";
import type { Card, NormalCard, Board } from "@/types/game";
import { getValidJokerPositionsForPlayer, getJokerWithCardOptions } from "@/game/rules";
import type { JokerWithCardOption } from "@/game/rules";
import { isJokerCard, areCardsEqual } from "@/utils/card";

export function useJokerMode(options: {
  isPlayerTurn: ComputedRef<boolean>;
  hand: ComputedRef<Card[]>;
  board: ComputedRef<Board | null>;
  onPlaceJoker: (pos: NormalCard) => void;
  onPlaceJokerWithCard: (jokerPos: NormalCard, companionCard: NormalCard) => void;
}) {
  const { isPlayerTurn, hand, board, onPlaceJoker, onPlaceJokerWithCard } = options;

  const jokerMode = ref(false);
  const selectedJokerPos = ref<NormalCard | null>(null);
  const showJokerNotification = ref(false);

  const humanHasJoker = computed(() => hand.value.some(isJokerCard));

  const jokerComboOptions = computed<JokerWithCardOption[]>(() => {
    if (!isPlayerTurn.value || !humanHasJoker.value || !board.value) return [];
    return getJokerWithCardOptions(hand.value, board.value);
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
    return getValidJokerPositionsForPlayer(board.value, hand.value);
  });

  function enterJokerMode() {
    if (!isPlayerTurn.value || !humanHasJoker.value) return;
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
    if (!isPlayerTurn.value || !jokerMode.value) return;
    const comboOption = jokerComboOptions.value.find((opt) => areCardsEqual(opt.jokerPos, pos));
    if (comboOption) {
      selectedJokerPos.value = pos;
    } else {
      jokerMode.value = false;
      onPlaceJoker(pos);
    }
  }

  function confirmJokerCombo() {
    if (!selectedJokerComboOption.value || !isPlayerTurn.value) return;
    const { jokerPos, companionCard } = selectedJokerComboOption.value;
    jokerMode.value = false;
    selectedJokerPos.value = null;
    onPlaceJokerWithCard(jokerPos, companionCard);
  }

  function confirmJokerAlone() {
    if (!selectedJokerPos.value || !isPlayerTurn.value) return;
    const pos = selectedJokerPos.value;
    jokerMode.value = false;
    selectedJokerPos.value = null;
    onPlaceJoker(pos);
  }

  function dismissJokerNotification() {
    showJokerNotification.value = false;
  }

  function notifyJokerReceived() {
    showJokerNotification.value = true;
  }

  function reset() {
    jokerMode.value = false;
    selectedJokerPos.value = null;
  }

  return {
    jokerMode,
    selectedJokerPos,
    showJokerNotification,
    humanHasJoker,
    jokerComboOptions,
    selectedJokerComboOption,
    comboHighlightPositions,
    validJokerPositions,
    enterJokerMode,
    cancelJokerMode,
    placeJokerAtPosition,
    confirmJokerCombo,
    confirmJokerAlone,
    dismissJokerNotification,
    notifyJokerReceived,
    reset,
  };
}
