<script setup lang="ts">
import { computed } from "vue";
import type { BoardSuit, NormalCard, Suit, Rank } from "@/types/game";
import { RANKS } from "@/game/constants";
import { suitSymbol, suitLabel, isRedSuit } from "@/utils/card";

const props = defineProps<{
  boardSuit: BoardSuit;
  jokerTargets?: NormalCard[];
}>();

const emit = defineEmits<{
  "joker-place": [suit: Suit, rank: Rank];
}>();

const isRed = computed(() => isRedSuit(props.boardSuit.suit));

function isPlaced(rank: number) {
  return rank >= props.boardSuit.low && rank <= props.boardSuit.high;
}

function isJokerTarget(rank: Rank) {
  return (
    props.jokerTargets?.some((t) => t.suit === props.boardSuit.suit && t.rank === rank) ?? false
  );
}
</script>

<template>
  <div class="flex items-center gap-1">
    <span
      class="hidden sm:inline sm:w-6 sm:text-lg font-bold"
      :class="isRed ? 'text-red-500' : 'text-gray-800'"
      :aria-label="suitLabel(boardSuit.suit)"
    >
      {{ suitSymbol(boardSuit.suit) }}
    </span>
    <div class="flex w-full gap-px sm:w-auto sm:gap-0.5">
      <CardSlot
        v-for="rank in RANKS"
        :key="rank"
        :rank="rank"
        :suit="boardSuit.suit"
        :placed="isPlaced(rank)"
        :is-seven="rank === 7"
        :is-joker-target="isJokerTarget(rank)"
        @joker-place="(s, r) => emit('joker-place', s, r)"
      />
    </div>
  </div>
</template>
