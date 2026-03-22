<script setup lang="ts">
import { computed } from "vue";
import type { Card } from "../../types/game";
import { rankLabel, suitSymbol, isRedSuit } from "../../utils/card";

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
    class="w-14 h-20 rounded-lg border-2 flex flex-col items-center justify-center text-base font-bold transition-all"
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
    @click="emit('play', card)"
  >
    <span>{{ rankLabel(card.rank) }}</span>
    <span>{{ suitSymbol(card.suit) }}</span>
  </button>
</template>
