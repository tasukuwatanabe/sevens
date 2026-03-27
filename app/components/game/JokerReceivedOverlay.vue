<script setup lang="ts">
const emit = defineEmits<{ close: [] }>();

onMounted(() => {
  setTimeout(() => emit("close"), 3000);
});
</script>

<template>
  <div
    class="fixed inset-0 bg-black/75 flex items-center justify-center z-50 cursor-pointer"
    role="dialog"
    aria-modal="true"
    aria-label="ジョーカーを引きました"
    @click="emit('close')"
  >
    <div class="text-center select-none">
      <div class="text-9xl mb-6 animate-bounce drop-shadow-lg">🃏</div>
      <p class="text-3xl font-bold text-white drop-shadow mb-2">ジョーカーを引きました！</p>
      <p class="text-sm text-gray-300">タップして続ける</p>
    </div>
  </div>
</template>
