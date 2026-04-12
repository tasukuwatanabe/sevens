<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const playerName = ref("");
const isCreating = ref(false);

async function createRoom() {
  if (!playerName.value.trim()) return;
  isCreating.value = true;
  try {
    const res = await fetch("/api/rooms", { method: "POST" }).then(
      (r) => r.json() as Promise<{ roomId: string }>,
    );
    sessionStorage.setItem("sevens-player-name", playerName.value.trim());
    router.push(`/room/${res.roomId}`);
  } finally {
    isCreating.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-green-900 text-white flex flex-col items-center justify-center p-4">
    <h1 class="text-4xl font-bold mb-8">7並べ</h1>

    <div class="flex flex-col gap-4 w-full max-w-sm">
      <router-link
        to="/play"
        class="block text-center px-6 py-4 bg-green-600 hover:bg-green-700 rounded-xl text-lg font-semibold transition-colors"
      >
        CPU対戦
      </router-link>

      <div class="border-t border-green-700 my-2" />

      <h2 class="text-center text-lg font-semibold">オンライン対戦</h2>
      <input
        v-model="playerName"
        type="text"
        placeholder="名前を入力"
        maxlength="10"
        class="px-4 py-3 rounded-xl text-gray-900 text-center text-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
        @keydown.enter="createRoom"
      />
      <button
        :disabled="!playerName.trim() || isCreating"
        class="px-6 py-4 rounded-xl text-lg font-semibold transition-colors"
        :class="
          playerName.trim()
            ? 'bg-yellow-500 hover:bg-yellow-600 text-white cursor-pointer'
            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
        "
        @click="createRoom"
      >
        {{ isCreating ? "作成中…" : "ルームを作成" }}
      </button>
    </div>
  </div>
</template>
