<script setup lang="ts">
defineProps<{
  message: string;
  isHumanTurn: boolean;
}>();
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
