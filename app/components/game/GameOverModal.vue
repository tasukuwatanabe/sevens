<script setup lang="ts">
import { computed } from "vue";
import type { PlayerId } from "../../types/game";

const props = defineProps<{
  winner: PlayerId;
  players: { id: PlayerId; name: string }[];
}>();

const emit = defineEmits<{
  reset: [];
}>();

const winnerName = computed(() => props.players.find((p) => p.id === props.winner)?.name ?? "");
const isHumanWin = computed(() => props.winner === "human");
</script>

<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-white rounded-2xl shadow-xl p-8 text-center max-w-sm w-full mx-4">
      <div class="text-4xl mb-3">{{ isHumanWin ? "🎉" : "😢" }}</div>
      <h2 class="text-2xl font-bold mb-2">
        {{ isHumanWin ? "勝利！" : "ゲームオーバー" }}
      </h2>
      <p class="text-gray-600 mb-6">{{ winnerName }}が上がりました！</p>
      <button
        class="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors cursor-pointer"
        @click="emit('reset')"
      >
        もう一度プレイ
      </button>
    </div>
  </div>
</template>
