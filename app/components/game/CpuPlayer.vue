<script setup lang="ts">
import { MAX_PASSES } from "../../../game/constants";

defineProps<{
  name: string;
  handCount: number;
  passesUsed: number;
  isCurrentTurn: boolean;
  isThinking: boolean;
}>();
</script>

<template>
  <div
    class="flex flex-col items-center gap-1 px-3 py-2 rounded-lg border"
    :class="isCurrentTurn ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50'"
  >
    <div class="text-xs font-semibold text-gray-700">{{ name }}</div>
    <div class="text-sm font-bold">{{ handCount }}枚</div>
    <div class="text-xs text-gray-500">パス {{ MAX_PASSES - passesUsed }}/{{ MAX_PASSES }}</div>
    <div v-if="isThinking" class="text-xs text-blue-500 animate-pulse">考え中…</div>
  </div>
</template>
