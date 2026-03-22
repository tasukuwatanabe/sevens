<script setup lang="ts">
import { computed } from "vue";
import type { Rank, Suit } from "../../types/game";
import { rankLabel, suitSymbol, isRedSuit } from "../../utils/card";

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
    class="w-14 h-20 rounded flex items-center justify-center text-sm font-bold select-none"
    :class="[
      placed || isSeven
        ? isRed
          ? 'bg-white border-2 border-red-400 text-red-600'
          : 'bg-white border-2 border-gray-700 text-gray-900'
        : 'bg-gray-100 border-2 border-dashed border-gray-300 text-gray-300',
    ]"
  >
    <template v-if="placed || isSeven">
      <span>{{ rankLabel(rank) }}</span>
      <span>{{ suitSymbol(suit) }}</span>
    </template>
    <template v-else>
      <span>{{ rankLabel(rank) }}</span>
    </template>
  </div>
</template>
