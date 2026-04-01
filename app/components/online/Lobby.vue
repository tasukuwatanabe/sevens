<script setup lang="ts">
import type { ClientRoomView } from "@/types/online";

const props = defineProps<{
  room: ClientRoomView;
}>();

const emit = defineEmits<{
  start: [];
}>();

const showShareModal = ref(false);
const roomUrl = computed(() => `${window.location.origin}/room/${props.room.roomId}`);
const humanCount = computed(() => props.room.seats.filter((s) => s.status === "human").length);
const canStart = computed(() => props.room.isHost && humanCount.value >= 1);
</script>

<template>
  <div class="flex flex-col items-center gap-6 p-4">
    <h2 class="text-2xl font-bold">ルーム: {{ room.roomId }}</h2>

    <div class="flex gap-3 flex-wrap justify-center">
      <PlayerSeat
        v-for="seat in room.seats"
        :key="seat.index"
        :seat="seat"
        :is-current-turn="false"
        :is-me="seat.index === room.mySeatIndex"
      />
    </div>

    <p class="text-green-300 text-sm">{{ humanCount }}/4 人が参加中</p>

    <div class="flex gap-2 flex-wrap justify-center">
      <button
        v-if="canStart"
        class="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-semibold transition-colors cursor-pointer"
        @click="emit('start')"
      >
        ゲーム開始（空席はCPUが参加）
      </button>
      <button
        class="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors cursor-pointer"
        @click="showShareModal = true"
      >
        友達を招待
      </button>
    </div>

    <ShareModal v-if="showShareModal" :room-url="roomUrl" @close="showShareModal = false" />
  </div>
</template>
