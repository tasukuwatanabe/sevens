<script setup lang="ts">
import { computed } from "vue";
import type { Card, NormalCard } from "@/types/game";
import { rankLabel, suitSymbol, suitLabel, isRedSuit, isJokerCard } from "@/utils/card";

const props = defineProps<{
  card: Card;
  isValid: boolean;
  disabled: boolean;
  isJokerMode?: boolean;
}>();

const emit = defineEmits<{
  play: [card: Card];
  "select-joker": [];
}>();

const isJoker = computed(() => isJokerCard(props.card));

const isRed = computed(() => {
  if (isJoker.value) return false;
  return isRedSuit((props.card as NormalCard).suit);
});

const buttonClasses = computed(() => {
  if (isJoker.value) {
    if (props.disabled || props.isJokerMode) {
      return "cursor-not-allowed opacity-50 bg-gradient-to-br from-red-300 via-yellow-300 to-blue-300 border-transparent text-white";
    }
    return "bg-gradient-to-br from-red-400 via-yellow-400 to-blue-400 border-transparent text-white hover:scale-105 hover:shadow-lg cursor-pointer animate-pulse";
  }
  if (props.disabled || props.isJokerMode) {
    return isRed.value
      ? "cursor-not-allowed border-red-200 bg-white text-red-300"
      : "cursor-not-allowed border-gray-200 bg-white text-gray-400";
  }
  if (props.isValid) {
    return isRed.value
      ? "border-red-400 bg-white text-red-600 hover:scale-105 hover:shadow-md cursor-pointer"
      : "border-gray-700 bg-white text-gray-900 hover:scale-105 hover:shadow-md cursor-pointer";
  }
  return isRed.value
    ? "border-red-200 bg-white text-red-400 cursor-not-allowed"
    : "border-gray-300 bg-white text-gray-500 cursor-not-allowed";
});

function handleClick() {
  if (isJoker.value) {
    if (!props.disabled && !props.isJokerMode) emit("select-joker");
  } else {
    emit("play", props.card);
  }
}
</script>

<template>
  <button
    class="w-10 h-14 sm:w-14 sm:h-20 rounded-lg border-2 flex flex-col items-center justify-center text-sm sm:text-base font-bold transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 focus-visible:outline-none"
    :class="buttonClasses"
    :disabled="isJoker ? disabled || isJokerMode : disabled || !isValid"
    :aria-label="
      isJoker
        ? 'ジョーカー'
        : `${suitLabel((card as NormalCard).suit)} ${rankLabel((card as NormalCard).rank)}${!isValid ? '（置けない）' : ''}`
    "
    @click="handleClick"
  >
    <template v-if="isJoker">
      <span aria-hidden="true" class="text-lg sm:text-xl">🃏</span>
      <span aria-hidden="true" class="text-xs">JOKER</span>
    </template>
    <template v-else>
      <span aria-hidden="true">{{ rankLabel((card as NormalCard).rank) }}</span>
      <span aria-hidden="true">{{ suitSymbol((card as NormalCard).suit) }}</span>
    </template>
  </button>
</template>
