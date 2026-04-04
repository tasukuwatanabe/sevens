<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

const cancelButtonRef = ref<HTMLButtonElement | null>(null);

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === "Escape") emit("cancel");
}

onMounted(() => {
  cancelButtonRef.value?.focus();
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
    aria-labelledby="home-confirm-title"
  >
    <div class="bg-white rounded-2xl shadow-xl p-8 text-center max-w-sm w-full mx-4">
      <h2 id="home-confirm-title" class="text-xl font-bold mb-3 text-gray-800">ゲームを中断</h2>
      <p class="text-gray-600 mb-6">トップページに戻りますか？現在のゲームは中断されます。</p>
      <div class="flex gap-3 justify-center">
        <button
          ref="cancelButtonRef"
          class="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400 focus-visible:outline-none"
          @click="emit('cancel')"
        >
          続ける
        </button>
        <button
          class="px-6 py-3 bg-gray-700 hover:bg-gray-800 text-white rounded-xl font-semibold transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-900 focus-visible:outline-none"
          @click="emit('confirm')"
        >
          トップに戻る
        </button>
      </div>
    </div>
  </div>
</template>
