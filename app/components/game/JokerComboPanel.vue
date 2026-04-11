<script setup lang="ts">
import type { JokerWithCardOption } from "@/game/rules";
import { getCompanionLabel } from "@/utils/joker";

const props = defineProps<{
  selectedJokerComboOption: JokerWithCardOption | null;
  jokerMode: boolean;
  selectedJokerPos: object | null;
}>();

const emit = defineEmits<{
  confirmCombo: [];
  confirmAlone: [];
  cancel: [];
}>();
</script>

<template>
  <template v-if="selectedJokerComboOption">
    <button
      class="px-4 py-2 rounded-lg bg-yellow-500 text-white font-medium hover:bg-yellow-600 transition-colors"
      @click="emit('confirmCombo')"
    >
      コンボで出す（ジョーカー + {{ getCompanionLabel(selectedJokerComboOption?.companionCard) }}）
    </button>
    <button
      class="px-4 py-2 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors"
      @click="emit('confirmAlone')"
    >
      ジョーカーのみ
    </button>
  </template>
  <button
    v-if="jokerMode"
    class="px-4 py-2 rounded-lg bg-gray-500 text-white font-medium hover:bg-gray-600 transition-colors"
    @click="emit('cancel')"
  >
    {{ selectedJokerPos ? "位置を選び直す" : "キャンセル" }}
  </button>
</template>
