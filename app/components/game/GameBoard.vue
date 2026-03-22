<script setup lang="ts">
import { SUITS } from "../../../game/constants";
import { useGame } from "../../composables/useGame";

const { state, currentPlayer, isHumanTurn, validCards, canPassTurn, playCard, pass, resetGame } =
  useGame();

const cpuPlayers = computed(() => state.value.players.filter((p) => p.type === "cpu"));

const humanPlayer = computed(() => state.value.players.find((p) => p.type === "human")!);

const statusMessage = computed(() => {
  if (state.value.cpuThinking) return `${currentPlayer.value.name}が考え中…`;
  if (isHumanTurn.value) {
    if (validCards.value.length > 0) return "カードを選んで置いてください";
    if (canPassTurn.value) return "置けるカードがありません。パスしてください";
    return "あなたのターン";
  }
  return `${currentPlayer.value.name}のターン`;
});
</script>

<template>
  <div class="min-h-screen bg-green-900 text-white p-4 flex flex-col gap-4">
    <h1 class="text-center text-2xl font-bold">7並べ</h1>

    <div class="flex justify-center gap-3">
      <CpuPlayer
        v-for="cpu in cpuPlayers"
        :key="cpu.id"
        :name="cpu.name"
        :hand-count="cpu.hand.length"
        :passes-used="cpu.passesUsed"
        :is-current-turn="currentPlayer.id === cpu.id"
        :is-thinking="state.cpuThinking && currentPlayer.id === cpu.id"
      />
    </div>

    <div class="bg-green-800 rounded-xl p-3 flex flex-col gap-1.5">
      <BoardRow v-for="suit in SUITS" :key="suit" :suit="suit" :board-suit="state.board[suit]" />
    </div>

    <GameStatus :message="statusMessage" :is-human-turn="isHumanTurn" />

    <div class="bg-green-800 rounded-xl p-3">
      <div class="text-xs text-center mb-2 text-green-300">
        {{ humanPlayer.name }}の手札（{{ humanPlayer.hand.length }}枚） — パス残り
        {{ 3 - humanPlayer.passesUsed }}/3
      </div>
      <PlayerHand
        :hand="humanPlayer.hand"
        :valid-cards="validCards"
        :disabled="!isHumanTurn || state.cpuThinking"
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
