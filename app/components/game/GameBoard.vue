<script setup lang="ts">
import { SUITS } from "../../../game/constants";
import { useGame } from "../../composables/useGame";

const {
  state,
  isHumanTurn,
  validCards,
  canPassTurn,
  cpuThinking,
  cpuPlayers,
  humanPlayer,
  statusMessage,
  currentPlayer,
  playCard,
  pass,
  resetGame,
} = useGame();
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
        :is-thinking="cpuThinking && currentPlayer.id === cpu.id"
        :player-index="index"
      />
    </div>

    <div class="bg-green-800 rounded-xl p-2 sm:p-3 flex flex-col gap-1 sm:gap-1.5">
      <BoardRow v-for="suit in SUITS" :key="suit" :suit="suit" :board-suit="state.board[suit]" />
    </div>

    <GameStatus :message="statusMessage" :is-human-turn="isHumanTurn" />

    <div class="bg-green-800 rounded-xl p-2 sm:p-3">
      <div class="text-xs text-center mb-2 text-green-300">
        {{ humanPlayer.name }}の手札（{{ humanPlayer.hand.length }}枚） — パス残り
        {{ 3 - humanPlayer.passesUsed }}/3
      </div>
      <PlayerHand
        :hand="humanPlayer.hand"
        :valid-cards="validCards"
        :disabled="!isHumanTurn || cpuThinking"
        @play="playCard"
      />
    </div>

    <ActionButtons
      :can-pass="canPassTurn"
      :is-human-turn="isHumanTurn"
      @pass="pass"
      @reset="resetGame"
    />

    <GameOverModal
      v-if="state.phase === 'gameover' && state.winner"
      :winner="state.winner"
      :players="state.players"
      @reset="resetGame"
    />
  </div>
</template>
