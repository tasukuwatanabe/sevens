<script setup lang="ts">
import type { Card } from "../../types/game";

const props = defineProps<{
  hand: Card[];
  validCards: Card[];
  disabled: boolean;
}>();

const emit = defineEmits<{
  play: [card: Card];
}>();

function isValid(card: Card) {
  return props.validCards.some((c) => c.suit === card.suit && c.rank === card.rank);
}
</script>

<template>
  <div class="flex flex-wrap gap-1 justify-center">
    <HandCard
      v-for="(card, i) in hand"
      :key="`${card.suit}-${card.rank}-${i}`"
      :card="card"
      :is-valid="isValid(card)"
      :disabled="disabled"
      @play="emit('play', $event)"
    />
  </div>
</template>
