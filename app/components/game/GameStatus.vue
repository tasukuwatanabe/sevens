<script setup lang="ts">
defineProps<{
  message: string;
  isHumanTurn: boolean;
}>();
</script>

<template>
  <div
    class="text-center py-2 px-4 rounded-lg text-sm font-medium"
    :class="isHumanTurn ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'"
  >
    {{ message }}
  </div>
</template>
