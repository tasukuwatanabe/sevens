<script setup lang="ts">
import { useModalKeyboard } from "@/composables/useModalKeyboard";

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

const { buttonRef } = useModalKeyboard(() => emit("cancel"));
</script>

<template>
  <div
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    role="dialog"
    aria-modal="true"
    aria-labelledby="reset-confirm-title"
  >
    <div class="bg-white rounded-2xl shadow-xl p-8 text-center max-w-sm w-full mx-4">
      <h2 id="reset-confirm-title" class="text-xl font-bold mb-3 text-gray-800">
        ゲームをリセット
      </h2>
      <p class="text-gray-600 mb-6">本当にリセットしますか？現在のゲームが終了します。</p>
      <div class="flex gap-3 justify-center">
        <button
          ref="buttonRef"
          class="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400 focus-visible:outline-none"
          @click="emit('cancel')"
        >
          キャンセル
        </button>
        <button
          class="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-700 focus-visible:outline-none"
          @click="emit('confirm')"
        >
          リセット
        </button>
      </div>
    </div>
  </div>
</template>
