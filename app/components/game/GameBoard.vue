<script setup lang="ts">
import { SUITS, MAX_PASSES } from "@/game/constants";
import { useGame } from "@/composables/useGame";
import { rankLabel, suitSymbol } from "@/utils/card";
import type { Suit, Rank, NormalCard } from "@/types/game";

const {
  state,
  isHumanTurn,
  validCards,
  canPassTurn,
  cpuThinking,
  thinkingPlayerId,
  cpuPlayers,
  humanPlayer,
  gameStatus,
  currentPlayer,
  jokerMode,
  selectedJokerPos,
  validJokerPositions,
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
} = useGame();

const showResetConfirm = ref(false);
const showHomeConfirm = ref(false);

function handleHomeRequest() {
  if (state.value.phase === "playing") {
    showHomeConfirm.value = true;
  } else {
    navigateTo("/");
  }
}

function confirmHome() {
  showHomeConfirm.value = false;
  navigateTo("/");
}

function cancelHome() {
  showHomeConfirm.value = false;
}

// コンボ確認 UI に表示するカード名（例: "♠J"）
const companionLabel = computed(() => {
  const c = selectedJokerComboOption.value?.companionCard;
  if (!c) return "";
  return `${suitSymbol(c.suit)}${rankLabel(c.rank)}`;
});

function handleResetRequest() {
  if (state.value.phase === "playing") {
    showResetConfirm.value = true;
  } else {
    resetGame();
  }
}

function confirmReset() {
  showResetConfirm.value = false;
  resetGame();
}

function cancelReset() {
  showResetConfirm.value = false;
}

function handleJokerPlace(suit: Suit, rank: Rank) {
  placeJokerAtPosition({ suit, rank } as NormalCard);
}
</script>

<template>
  <div class="min-h-screen bg-green-900 text-white p-2 sm:p-4 flex flex-col gap-2 sm:gap-4">
    <div class="flex items-center justify-center relative">
      <h1 class="text-xl sm:text-2xl font-bold">7並べ</h1>
      <button
        class="absolute right-0 text-green-300 underline text-sm cursor-pointer hover:text-green-100 transition-colors"
        @click="handleHomeRequest"
      >
        ホームへ戻る
      </button>
    </div>

    <div class="flex justify-center gap-3">
      <CpuPlayer
        v-for="(cpu, index) in cpuPlayers"
        :key="cpu.id"
        :name="cpu.name"
        :hand-count="cpu.hand.length"
        :passes-used="cpu.passesUsed"
        :is-current-turn="currentPlayer.id === cpu.id"
        :is-thinking="thinkingPlayerId === cpu.id"
        :player-index="index"
      />
    </div>

    <div class="bg-green-800 rounded-xl p-2 sm:p-3 flex flex-col gap-1 sm:gap-1.5">
      <BoardRow
        v-for="suit in SUITS"
        :key="suit"
        :board-suit="state.board[suit]"
        :joker-targets="validJokerPositions"
        :combo-highlight-targets="comboHighlightPositions"
        @joker-place="handleJokerPlace"
      />
    </div>

    <GameStatus :status="gameStatus" :player-name="currentPlayer.name" />

    <div class="bg-green-800 rounded-xl p-2 sm:p-3">
      <div class="text-xs text-center mb-2 text-green-300">
        {{ humanPlayer.name }}の手札（{{ humanPlayer.hand.length }}枚） — パス残り
        {{ MAX_PASSES - humanPlayer.passesUsed }}/{{ MAX_PASSES }}
      </div>
      <PlayerHand
        :hand="humanPlayer.hand"
        :valid-cards="validCards"
        :disabled="!isHumanTurn || cpuThinking"
        :joker-mode="jokerMode"
        @play="playCard"
        @select-joker="enterJokerMode"
      />
    </div>

    <div class="flex gap-2 justify-center flex-wrap">
      <template v-if="selectedJokerComboOption">
        <button
          class="px-4 py-2 rounded-lg bg-yellow-500 text-white font-medium hover:bg-yellow-600 transition-colors"
          @click="confirmJokerCombo"
        >
          コンボで出す（ジョーカー + {{ companionLabel }}）
        </button>
        <button
          class="px-4 py-2 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors"
          @click="confirmJokerAlone"
        >
          ジョーカーのみ
        </button>
      </template>
      <button
        v-if="jokerMode"
        class="px-4 py-2 rounded-lg bg-gray-500 text-white font-medium hover:bg-gray-600 transition-colors"
        @click="cancelJokerMode"
      >
        {{ selectedJokerPos ? "位置を選び直す" : "キャンセル" }}
      </button>
      <ActionButtons
        :can-pass="canPassTurn"
        :is-human-turn="isHumanTurn && !jokerMode"
        @pass="pass"
        @reset="handleResetRequest"
      />
    </div>

    <GameOverModal
      v-if="state.phase === 'gameover' && state.winner"
      :winner="state.winner"
      :players="state.players"
      @reset="resetGame"
      @go-home="navigateTo('/')"
    />

    <ResetConfirmModal v-if="showResetConfirm" @confirm="confirmReset" @cancel="cancelReset" />

    <HomeConfirmModal v-if="showHomeConfirm" @confirm="confirmHome" @cancel="cancelHome" />

    <JokerReceivedOverlay v-if="showJokerNotification" @close="dismissJokerNotification" />
  </div>
</template>
