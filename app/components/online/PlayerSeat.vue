<script setup lang="ts">
import { computed } from "vue";
import type { SeatInfo } from "@/types/online";
import { MAX_PASSES } from "@/game/constants";

const props = defineProps<{
  seat: SeatInfo;
  isCurrentTurn: boolean;
  handCount?: number;
  passesUsed?: number;
  eliminated?: boolean;
  isMe: boolean;
}>();

const SEAT_COLORS = [
  { border: "border-green-400", bg: "bg-green-50", text: "text-green-600" },
  { border: "border-blue-400", bg: "bg-blue-50", text: "text-blue-500" },
  { border: "border-orange-400", bg: "bg-orange-50", text: "text-orange-500" },
  { border: "border-violet-400", bg: "bg-violet-50", text: "text-violet-500" },
] as const;

const color = computed(() => SEAT_COLORS[props.seat.index] ?? SEAT_COLORS[0]);
</script>

<template>
  <div
    class="flex flex-col items-center gap-1 px-2 py-1 sm:px-3 sm:py-2 rounded-lg border min-w-[5rem]"
    :class="
      eliminated
        ? 'border-gray-300 bg-gray-100 opacity-60'
        : isCurrentTurn
          ? [color.border, color.bg]
          : 'border-gray-200 bg-gray-50'
    "
  >
    <div class="text-xs font-semibold text-gray-700 truncate max-w-[6rem]">
      {{ seat.playerName ?? "空席" }}
      <span v-if="isMe" class="text-green-600">(自分)</span>
    </div>
    <div v-if="seat.status === 'empty'" class="text-xs text-gray-400">待機中…</div>
    <template v-else-if="eliminated">
      <div class="text-sm font-bold text-red-500">脱落</div>
    </template>
    <template v-else>
      <div class="flex items-center gap-1">
        <span v-if="seat.status === 'cpu'" class="text-xs text-gray-400">CPU</span>
        <span v-else-if="seat.isConnected" class="inline-block w-2 h-2 rounded-full bg-green-500" />
        <span v-else class="inline-block w-2 h-2 rounded-full bg-red-400" title="切断" />
      </div>
      <template v-if="handCount !== undefined">
        <div class="text-sm font-bold text-gray-900">{{ handCount }}枚</div>
        <div v-if="passesUsed !== undefined" class="text-xs text-gray-500">
          パス {{ MAX_PASSES - passesUsed }}/{{ MAX_PASSES }}
        </div>
      </template>
    </template>
  </div>
</template>
