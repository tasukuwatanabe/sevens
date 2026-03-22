<script setup lang="ts">
import { computed } from "vue";
import type { BoardSuit } from "@/types/game";
import { RANKS } from "@/game/constants";
import { suitSymbol, suitLabel, isRedSuit } from "@/utils/card";

const props = defineProps<{
  boardSuit: BoardSuit;
}>();

const isRed = computed(() => isRedSuit(props.boardSuit.suit));

function isPlaced(rank: number) {
  return rank >= props.boardSuit.low && rank <= props.boardSuit.high;
}
</script>

<template>
  <div class="flex items-center gap-1">
    <span
      class="w-5 text-sm sm:w-6 sm:text-lg font-bold"
      :class="isRed ? 'text-red-500' : 'text-gray-800'"
      :aria-label="suitLabel(boardSuit.suit)"
    >
      {{ suitSymbol(boardSuit.suit) }}
    </span>
    <div class="flex gap-px sm:gap-0.5">
      <CardSlot
        v-for="rank in RANKS"
        :key="rank"
        :rank="rank"
        :suit="boardSuit.suit"
        :placed="isPlaced(rank)"
        :is-seven="rank === 7"
      />
    </div>
  </div>
</template>
