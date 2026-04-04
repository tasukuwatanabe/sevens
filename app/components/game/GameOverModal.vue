<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from "vue";
import type { PlayerId } from "@/types/game";

const props = defineProps<{
  winner: PlayerId;
  players: { id: PlayerId; name: string }[];
}>();

const emit = defineEmits<{
  reset: [];
  "go-home": [];
}>();

const winnerName = computed(() => props.players.find((p) => p.id === props.winner)?.name ?? "");
const isHumanWin = computed(() => props.winner === "human");

const resetButtonRef = ref<HTMLButtonElement | null>(null);

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === "Escape") emit("reset");
}

onMounted(() => {
  resetButtonRef.value?.focus();
  document.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeyDown);
});
</script>

<template>
  <div
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    role="dialog"
    aria-modal="true"
    aria-labelledby="game-over-title"
  >
    <div class="bg-white rounded-2xl shadow-xl p-8 text-center max-w-sm w-full mx-4">
      <div class="text-4xl mb-3" aria-hidden="true">
        {{ isHumanWin ? "🎉" : "😢" }}
      </div>
      <h2 id="game-over-title" class="text-2xl font-bold mb-2">
        {{ isHumanWin ? "勝利！" : "ゲームオーバー" }}
      </h2>
      <p class="text-gray-600 mb-6">{{ winnerName }}が上がりました！</p>
      <div class="flex gap-3 justify-center flex-wrap">
        <button
          ref="resetButtonRef"
          class="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-700 focus-visible:outline-none"
          @click="emit('reset')"
        >
          もう一度プレイ
        </button>
        <button
          class="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400 focus-visible:outline-none"
          @click="emit('go-home')"
        >
          トップに戻る
        </button>
      </div>
    </div>
  </div>
</template>
