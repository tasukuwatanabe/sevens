<script setup lang="ts">
import { computed } from "vue";
import type { Rank, Suit } from "@/types/game";
import { rankLabel, suitSymbol, suitLabel, isRedSuit } from "@/utils/card";

const props = defineProps<{
  rank: Rank;
  suit: Suit;
  placed: boolean;
  isSeven: boolean;
  isJokerTarget?: boolean;
  isComboHighlight?: boolean;
}>();

const emit = defineEmits<{
  "joker-place": [suit: Suit, rank: Rank];
}>();

const isRed = computed(() => isRedSuit(props.suit));
</script>

<template>
  <div
    class="flex-1 aspect-[7/10] max-w-10 sm:flex-none sm:max-w-none sm:aspect-auto sm:w-14 sm:h-20 rounded flex items-center justify-center text-xs sm:text-sm font-bold select-none transition-all"
    :class="[
      isComboHighlight
        ? 'bg-yellow-100 border-2 border-yellow-500 text-yellow-700 opacity-100 animate-pulse'
        : isJokerTarget
          ? 'bg-gradient-to-br from-red-200 via-yellow-200 to-blue-200 border-2 border-dashed border-yellow-400 text-yellow-700 opacity-100 cursor-pointer animate-pulse hover:scale-105'
          : placed || isSeven
            ? isRed
              ? 'bg-white border-2 border-red-400 text-red-600'
              : 'bg-white border-2 border-gray-700 text-gray-900'
            : 'bg-gray-100 border-2 border-dashed border-gray-300 text-gray-500',
    ]"
    :role="isJokerTarget && !isComboHighlight ? 'button' : 'img'"
    :aria-label="
      isJokerTarget && !isComboHighlight
        ? `ジョーカーを${suitLabel(suit)} ${rankLabel(rank)}に置く`
        : isComboHighlight
          ? `${suitLabel(suit)} ${rankLabel(rank)}、コンボ出し対象`
          : placed
            ? `${suitLabel(suit)} ${rankLabel(rank)}、配置済み`
            : isSeven
              ? `${suitLabel(suit)} 7、起点`
              : `${suitLabel(suit)} ${rankLabel(rank)}、未配置`
    "
    @click="isJokerTarget && !isComboHighlight && emit('joker-place', suit, rank)"
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
