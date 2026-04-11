<script setup lang="ts">
defineProps<{
  canPass: boolean;
  isHumanTurn: boolean;
}>();

const emit = defineEmits<{
  pass: [];
  reset: [];
}>();
</script>

<template>
  <div class="flex gap-2 justify-center">
    <button
      class="w-24 px-4 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-yellow-500 focus-visible:outline-none"
      :class="
        canPass && isHumanTurn
          ? 'bg-yellow-400 hover:bg-yellow-500 text-white cursor-pointer'
          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
      "
      :disabled="!canPass || !isHumanTurn"
      @click="emit('pass')"
    >
      パス
    </button>
    <button
      class="w-24 px-4 py-2 rounded-lg text-sm font-medium bg-red-100 hover:bg-red-200 text-red-700 cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500 focus-visible:outline-none"
      @click="emit('reset')"
    >
      リセット
    </button>
  </div>
</template>
