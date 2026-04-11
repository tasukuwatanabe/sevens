<script setup lang="ts">
import { computed } from "vue";
import type { GameStatusCode } from "@/types/game";

const props = defineProps<{
  status: GameStatusCode;
  playerName: string;
}>();

const STATUS_MESSAGES: Record<GameStatusCode, (name: string) => string> = {
  "cpu-thinking": (name) => `${name}が考え中…`,
  "human-place": () => "カードを選んで置いてください",
  "human-must-pass": () => "置けるカードがありません。パスしてください",
  "human-joker-or-pass": () => "置けるカードがありません。ジョーカーを出すかパスしてください",
  "human-turn": () => "あなたのターン",
  "human-eliminated": () => "パスの上限に達しました。脱落です…",
  "cpu-turn": (name) => `${name}のターン`,
  "human-joker-mode": () => "ジョーカーを置く場所を選んでください",
  "human-joker-combo-select": () => "ジョーカーと一緒にカードを出しますか？",
};

const isHumanTurn = computed(
  () =>
    props.status === "human-place" ||
    props.status === "human-must-pass" ||
    props.status === "human-joker-or-pass" ||
    props.status === "human-turn" ||
    props.status === "human-eliminated" ||
    props.status === "human-joker-mode" ||
    props.status === "human-joker-combo-select",
);

const message = computed(() => STATUS_MESSAGES[props.status](props.playerName));
</script>

<template>
  <div
    class="text-center py-2 px-4 rounded-lg text-sm font-medium min-h-[2.25rem] flex items-center justify-center"
    :class="isHumanTurn ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'"
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    {{ message }}
  </div>
</template>
