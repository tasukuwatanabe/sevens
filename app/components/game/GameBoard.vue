<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { SUITS, MAX_PASSES } from "@/game/constants";
import { useGame } from "@/composables/useGame";
import type { Suit, Rank, NormalCard } from "@/types/game";
import CpuPlayer from "./CpuPlayer.vue";
import BoardRow from "./BoardRow.vue";
import GameStatus from "./GameStatus.vue";
import PlayerHand from "./PlayerHand.vue";
import JokerComboPanel from "./JokerComboPanel.vue";
import ActionButtons from "./ActionButtons.vue";
import GameOverModal from "./GameOverModal.vue";
import ResetConfirmModal from "./ResetConfirmModal.vue";
import HomeConfirmModal from "./HomeConfirmModal.vue";
import JokerReceivedOverlay from "./JokerReceivedOverlay.vue";

const router = useRouter();

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
    router.push("/");
  }
}

function confirmHome() {
  showHomeConfirm.value = false;
  router.push("/");
}

function cancelHome() {
  showHomeConfirm.value = false;
}

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
  <div class="min-h-screen bg-green-900 text-white p-0.5 sm:p-4 flex flex-col gap-0.5 sm:gap-4">
    <div class="flex items-center justify-center relative">
      <h1 class="text-base sm:text-2xl font-bold leading-none">7並べ</h1>
      <button
        class="absolute right-0 text-green-300 underline text-xs sm:text-sm cursor-pointer hover:text-green-100 transition-colors"
        @click="handleHomeRequest"
      >
        ホームへ戻る
      </button>
    </div>

    <div class="flex justify-center gap-1.5 sm:gap-3">
      <CpuPlayer
        v-for="(cpu, index) in cpuPlayers"
        :key="cpu.id"
        :name="cpu.name"
        :hand-count="cpu.hand.length"
        :passes-used="cpu.passesUsed"
        :is-current-turn="currentPlayer.id === cpu.id"
        :is-thinking="thinkingPlayerId === cpu.id"
        :player-index="index"
        :eliminated="cpu.eliminated"
      />
    </div>

    <div class="bg-green-800 rounded-xl p-1 sm:p-3 flex flex-col gap-0.5 sm:gap-1.5">
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

    <div class="bg-green-800 rounded-xl p-1 sm:p-3">
      <div class="text-xs text-center mb-0.5 sm:mb-2 text-green-300">
        <template v-if="humanPlayer.eliminated"> {{ humanPlayer.name }} — 脱落 </template>
        <template v-else>
          {{ humanPlayer.name }}の手札（{{ humanPlayer.hand.length }}枚） — パス残り
          {{ MAX_PASSES - humanPlayer.passesUsed }}/{{ MAX_PASSES }}
        </template>
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
      <JokerComboPanel
        :selected-joker-combo-option="selectedJokerComboOption"
        :joker-mode="jokerMode"
        :selected-joker-pos="selectedJokerPos"
        @confirm-combo="confirmJokerCombo"
        @confirm-alone="confirmJokerAlone"
        @cancel="cancelJokerMode"
      />
      <ActionButtons
        :can-pass="canPassTurn"
        :is-human-turn="isHumanTurn && !jokerMode"
        @pass="pass"
        @reset="handleResetRequest"
      />
    </div>

    <GameOverModal
      v-if="state.phase === 'gameover'"
      :winner="state.winner"
      :players="state.players"
      @reset="resetGame"
      @go-home="navigateTo('/')"
    />

    <ConfirmModal
      v-if="showResetConfirm"
      title="確認"
      message="ゲームをリセットしますか？現在のゲーム状態は削除されます。"
      confirm-text="リセット"
      cancel-text="キャンセル"
      is-dangerous
      @confirm="confirmReset"
      @cancel="cancelReset"
    />

    <ConfirmModal
      v-if="showHomeConfirm"
      title="ゲームを中断"
      message="トップページに戻りますか？現在のゲームは中断されます。"
      confirm-text="トップに戻る"
      cancel-text="続ける"
      is-dangerous
      @confirm="confirmHome"
      @cancel="cancelHome"
    />

    <JokerReceivedOverlay v-if="showJokerNotification" @close="dismissJokerNotification" />
  </div>
</template>
