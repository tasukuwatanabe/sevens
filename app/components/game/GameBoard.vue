<script setup lang="ts">
import { SUITS, MAX_PASSES } from "@/game/constants";
import { useGame } from "@/composables/useGame";
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
  validJokerPositions,
  showJokerNotification,
  playCard,
  pass,
  resetGame,
  enterJokerMode,
  cancelJokerMode,
  placeJokerAtPosition,
  dismissJokerNotification,
} = useGame();

const showResetConfirm = ref(false);

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
    <h1 class="text-center text-xl sm:text-2xl font-bold">7並べ</h1>

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
      <button
        v-if="jokerMode"
        class="px-4 py-2 rounded-lg bg-gray-500 text-white font-medium hover:bg-gray-600 transition-colors"
        @click="cancelJokerMode"
      >
        キャンセル
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
    />

    <ResetConfirmModal v-if="showResetConfirm" @confirm="confirmReset" @cancel="cancelReset" />

    <JokerReceivedOverlay v-if="showJokerNotification" @close="dismissJokerNotification" />
  </div>
</template>
