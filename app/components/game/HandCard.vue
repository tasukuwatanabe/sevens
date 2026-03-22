<script setup lang="ts">
import { computed } from "vue";
import type { Card } from "../../types/game";
import { rankLabel, suitSymbol, suitLabel, isRedSuit } from "../../utils/card";

const props = defineProps<{
  card: Card;
  isValid: boolean;
  disabled: boolean;
}>();

const emit = defineEmits<{
  play: [card: Card];
}>();

const isRed = computed(() => isRedSuit(props.card.suit));
</script>

<template>
  <button
    class="w-10 h-14 sm:w-14 sm:h-20 rounded-lg border-2 flex flex-col items-center justify-center text-sm sm:text-base font-bold transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 focus-visible:outline-none"
    :class="[
      disabled
        ? 'opacity-40 cursor-not-allowed border-gray-200 bg-gray-50'
        : isValid
          ? isRed
            ? 'border-red-400 bg-white text-red-600 hover:scale-105 hover:shadow-md cursor-pointer'
            : 'border-gray-700 bg-white text-gray-900 hover:scale-105 hover:shadow-md cursor-pointer'
          : isRed
            ? 'border-red-200 bg-white text-red-400 cursor-not-allowed'
            : 'border-gray-300 bg-white text-gray-500 cursor-not-allowed',
    ]"
    :disabled="disabled || !isValid"
    :aria-label="`${suitLabel(card.suit)} ${rankLabel(card.rank)}${!isValid ? '（置けない）' : ''}`"
    @click="emit('play', card)"
  >
    <span aria-hidden="true">{{ rankLabel(card.rank) }}</span>
    <span aria-hidden="true">{{ suitSymbol(card.suit) }}</span>
  </button>
</template>
