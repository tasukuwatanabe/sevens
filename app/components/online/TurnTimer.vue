<script setup lang="ts">
const props = defineProps<{
  remaining: number | null;
}>();

const isUrgent = computed(() => props.remaining !== null && props.remaining <= 10);
</script>

<template>
  <div
    v-if="remaining !== null"
    class="text-center text-sm font-mono font-bold py-1"
    :class="isUrgent ? 'text-red-400 animate-pulse' : 'text-green-300'"
  >
    残り {{ remaining }}秒
  </div>
</template>
