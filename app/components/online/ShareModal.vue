<script setup lang="ts">
import { ref } from "vue";
import { COPY_FEEDBACK_DELAY_MS } from "@/game/constants";

const props = defineProps<{
  roomUrl: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const copied = ref(false);

async function copyUrl() {
  await navigator.clipboard.writeText(props.roomUrl);
  copied.value = true;
  setTimeout(() => (copied.value = false), COPY_FEEDBACK_DELAY_MS);
}

function shareLine() {
  const text = `7並べで対戦しよう！\n${props.roomUrl}`;
  window.open(`https://line.me/R/share?text=${encodeURIComponent(text)}`, "_blank", "noopener");
}
</script>

<template>
  <div
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    role="dialog"
    aria-modal="true"
    @click.self="emit('close')"
  >
    <div class="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
      <h2 class="text-lg font-bold text-gray-900 mb-4">友達を招待</h2>
      <div class="bg-gray-100 rounded-lg p-3 mb-4 break-all text-sm text-gray-700 select-all">
        {{ roomUrl }}
      </div>
      <div class="flex gap-2">
        <button
          class="flex-1 px-4 py-2 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors cursor-pointer"
          @click="copyUrl"
        >
          {{ copied ? "コピーしました!" : "URLをコピー" }}
        </button>
        <button
          class="flex-1 px-4 py-2 rounded-lg bg-green-500 text-white font-medium hover:bg-green-600 transition-colors cursor-pointer"
          @click="shareLine"
        >
          LINEで共有
        </button>
      </div>
      <button
        class="mt-3 w-full px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition-colors cursor-pointer"
        @click="emit('close')"
      >
        閉じる
      </button>
    </div>
  </div>
</template>
