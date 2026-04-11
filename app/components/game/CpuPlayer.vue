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
  eliminated: boolean;
}>();

const color = computed(() => CPU_PLAYER_COLORS[props.playerIndex] ?? CPU_PLAYER_COLORS[0]);
</script>

<template>
  <div
    class="flex flex-col items-center gap-px px-1 py-0.5 sm:gap-1 sm:px-3 sm:py-2 rounded-lg border leading-none"
    :class="[
      eliminated
        ? 'border-gray-300 bg-gray-100 opacity-60'
        : isCurrentTurn || isThinking
          ? [color.border, color.bg]
          : 'border-gray-200 bg-gray-50',
      isThinking ? 'animate-pulse sm:animate-none' : '',
    ]"
    :aria-current="isCurrentTurn ? 'true' : undefined"
  >
    <div class="text-[10px] sm:text-xs font-semibold text-gray-700">{{ name }}</div>
    <template v-if="eliminated">
      <div class="text-xs sm:text-sm font-bold text-red-500">脱落</div>
    </template>
    <template v-else>
      <div class="text-xs sm:text-sm font-bold text-gray-900">{{ handCount }}枚</div>
      <div class="text-[10px] sm:text-xs text-gray-500">
        パス {{ MAX_PASSES - passesUsed }}/{{ MAX_PASSES }}
      </div>
      <div class="hidden sm:flex text-xs h-4 items-center justify-center">
        <span v-if="isThinking" class="animate-pulse" :class="color.text">考え中…</span>
        <span v-else-if="isCurrentTurn" class="font-semibold text-gray-700">ターン中</span>
      </div>
    </template>
  </div>
</template>
