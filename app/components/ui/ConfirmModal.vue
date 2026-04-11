<script setup lang="ts">
import { useModalKeyboard } from "@/composables/useModalKeyboard";

const props = withDefaults(
  defineProps<{
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDangerous?: boolean;
  }>(),
  {
    confirmText: "確認",
    cancelText: "キャンセル",
    isDangerous: false,
  },
);

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
  >
    <div class="bg-white rounded-2xl shadow-xl p-8 text-center max-w-sm w-full mx-4">
      <h2 class="text-xl font-bold mb-3 text-gray-800">{{ title }}</h2>
      <p class="text-gray-600 mb-6">{{ message }}</p>
      <div class="flex gap-3 justify-center">
        <button
          ref="buttonRef"
          class="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400 focus-visible:outline-none"
          @click="emit('cancel')"
        >
          {{ cancelText }}
        </button>
        <button
          :class="[
            'px-6 py-3 rounded-xl font-semibold transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
            isDangerous
              ? 'bg-gray-700 hover:bg-gray-800 text-white focus-visible:ring-gray-900'
              : 'bg-blue-500 hover:bg-blue-600 text-white focus-visible:ring-blue-700',
          ]"
          @click="emit('confirm')"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>
