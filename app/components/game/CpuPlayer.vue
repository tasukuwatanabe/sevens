<script setup lang="ts">
import { computed } from "vue";
import { MAX_PASSES } from "@/game/constants";

const props = defineProps<{
  name: string;
  handCount: number;
  passesUsed: number;
  isCurrentTurn: boolean;
  isThinking: boolean;
  playerIndex: number;
}>();

const colors = [
  { border: "border-blue-400", bg: "bg-blue-50", text: "text-blue-500" },
  { border: "border-orange-400", bg: "bg-orange-50", text: "text-orange-500" },
  { border: "border-violet-400", bg: "bg-violet-50", text: "text-violet-500" },
];

const color = computed(() => colors[props.playerIndex] ?? colors[0]!);
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
