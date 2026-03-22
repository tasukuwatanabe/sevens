<script setup lang="ts">
import { computed } from "vue";
import { MAX_PASSES, CPU_PLAYER_COLORS } from "@/game/constants";

const props = defineProps<{
  name: string;
  handCount: number;
  passesUsed: number;
  isCurrentTurn: boolean;
  isThinking: boolean;
  playerIndex: number;
}>();

const color = computed(() => CPU_PLAYER_COLORS[props.playerIndex] ?? CPU_PLAYER_COLORS[0]);
</script>

<template>
  <div
    class="flex flex-col items-center gap-1 px-2 py-1 sm:px-3 sm:py-2 rounded-lg border"
    :class="isCurrentTurn ? [color.border, color.bg] : 'border-gray-200 bg-gray-50'"
    :aria-current="isCurrentTurn ? 'true' : undefined"
  >
    <div class="text-xs font-semibold text-gray-700">{{ name }}</div>
    <div class="text-sm font-bold text-gray-900">{{ handCount }}枚</div>
    <div class="text-xs text-gray-500">パス {{ MAX_PASSES - passesUsed }}/{{ MAX_PASSES }}</div>
    <div v-show="isCurrentTurn" class="text-xs font-semibold text-gray-700">ターン中</div>
    <div v-show="isThinking" class="text-xs animate-pulse" :class="color.text">考え中…</div>
  </div>
</template>
