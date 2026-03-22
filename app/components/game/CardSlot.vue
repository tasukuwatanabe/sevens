<script setup lang="ts">
import { computed } from "vue";
import type { Rank, Suit } from "@/types/game";
import { rankLabel, suitSymbol, suitLabel, isRedSuit } from "@/utils/card";

const props = defineProps<{
  rank: Rank;
  suit: Suit;
  placed: boolean;
  isSeven: boolean;
}>();

const isRed = computed(() => isRedSuit(props.suit));
</script>

<template>
  <div
    class="w-7 h-10 sm:w-14 sm:h-20 rounded flex items-center justify-center text-xs sm:text-sm font-bold select-none"
    :class="[
      placed || isSeven
        ? isRed
          ? 'bg-white border-2 border-red-400 text-red-600'
          : 'bg-white border-2 border-gray-700 text-gray-900'
        : 'bg-gray-100 border-2 border-dashed border-gray-400 text-gray-600',
    ]"
    role="img"
    :aria-label="
      placed
        ? `${suitLabel(suit)} ${rankLabel(rank)}、配置済み`
        : isSeven
          ? `${suitLabel(suit)} 7、起点`
          : `${suitLabel(suit)} ${rankLabel(rank)}、未配置`
    "
  >
    <template v-if="placed || isSeven">
      <span aria-hidden="true">{{ rankLabel(rank) }}</span>
      <span aria-hidden="true">{{ suitSymbol(suit) }}</span>
    </template>
    <template v-else>
      <span aria-hidden="true">{{ rankLabel(rank) }}</span>
    </template>
  </div>
</template>
