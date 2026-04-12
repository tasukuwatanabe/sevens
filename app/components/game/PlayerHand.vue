<script setup lang="ts">
import { computed } from "vue";
import type { Card } from "@/types/game";
import { areCardsEqual, isJokerCard, isNormalCard } from "@/utils/card";
import { SUITS } from "@/game/constants";
import HandCard from "./HandCard.vue";

const props = defineProps<{
  hand: Card[];
  validCards: Card[];
  disabled: boolean;
  jokerMode?: boolean;
}>();

const emit = defineEmits<{
  play: [card: Card];
  "select-joker": [];
}>();

const sortedHand = computed(() => {
  const normalCards = props.hand.filter(isNormalCard);
  const jokerCards = props.hand.filter(isJokerCard);

  const sorted = normalCards.sort((a, b) => {
    const suitIndexA = SUITS.indexOf(a.suit);
    const suitIndexB = SUITS.indexOf(b.suit);

    if (suitIndexA !== suitIndexB) {
      return suitIndexA - suitIndexB;
    }

    return a.rank - b.rank;
  });

  return [...sorted, ...jokerCards];
});

function isValid(card: Card) {
  if (isJokerCard(card)) return true;
  return props.validCards.some((c) => areCardsEqual(c, card));
}

function cardKey(card: Card, i: number) {
  if (isJokerCard(card)) return `joker-${i}`;
  if (isNormalCard(card)) return `${card.suit}-${card.rank}-${i}`;
  return `unknown-${i}`;
}
</script>

<template>
  <div class="flex flex-wrap gap-0.5 sm:gap-1 justify-center">
    <HandCard
      v-for="(card, i) in sortedHand"
      :key="cardKey(card, i)"
      :card="card"
      :is-valid="isValid(card)"
      :disabled="disabled"
      :is-joker-mode="jokerMode"
      @play="emit('play', $event)"
      @select-joker="emit('select-joker')"
    />
  </div>
</template>
