<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { SUITS, MAX_PASSES } from "@/game/constants";
import { useOnlineGame } from "@/composables/useOnlineGame";
import { getCompanionLabel } from "@/utils/joker";
import type { Suit, Rank, NormalCard } from "@/types/game";
import Lobby from "@/components/online/Lobby.vue";
import PlayerSeat from "@/components/online/PlayerSeat.vue";
import TurnTimer from "@/components/online/TurnTimer.vue";
import BoardRow from "@/components/game/BoardRow.vue";
import PlayerHand from "@/components/game/PlayerHand.vue";
import JokerReceivedOverlay from "@/components/game/JokerReceivedOverlay.vue";
import ConfirmModal from "@/components/ui/ConfirmModal.vue";

const route = useRoute();
const router = useRouter();
const roomId = route.params.id as string;

const {
  room,
  connected,
  error,
  myHand,
  isMyTurn,
  validCards,
  canPassTurn,
  jokerMode,
  selectedJokerPos,
  validJokerPositions,
  selectedJokerComboOption,
  comboHighlightPositions,
  showJokerNotification,
  currentSeatIndex,
  gameStatus,
  turnTimeRemaining,
  connect,
  playCard,
  pass,
  startGame,
  enterJokerMode,
  cancelJokerMode,
  placeJokerAtPosition,
  confirmJokerCombo,
  confirmJokerAlone,
  dismissJokerNotification,
} = useOnlineGame(roomId);

const nameInput = ref("");
const needsName = ref(false);

onMounted(() => {
  const storedName = sessionStorage.getItem("sevens-player-name");
  if (storedName) {
    connect(storedName);
  } else {
    needsName.value = true;
  }
});

function joinWithName() {
  if (!nameInput.value.trim()) return;
  sessionStorage.setItem("sevens-player-name", nameInput.value.trim());
  needsName.value = false;
  connect(nameInput.value.trim());
}

function handleJokerPlace(suit: Suit, rank: Rank) {
  placeJokerAtPosition({ suit, rank } as NormalCard);
}

const currentPlayerName = computed(() => {
  if (!room.value?.game) return "";
  const seat = room.value.seats[room.value.game.currentSeatIndex];
  return seat?.playerName ?? `CPU ${room.value.game.currentSeatIndex + 1}`;
});

const winnerSeatIndex = computed(() => room.value?.game?.winner ?? null);
const winnerName = computed(() => {
  if (winnerSeatIndex.value === null || !room.value) return "";
  return room.value.seats[winnerSeatIndex.value]?.playerName ?? "";
});
const isMyWin = computed(
  () => winnerSeatIndex.value !== null && winnerSeatIndex.value === room.value?.mySeatIndex,
);

const showLeaveConfirm = ref(false);

function backToHome() {
  router.push("/");
}
</script>

<template>
  <!-- Name input for direct URL access -->
  <div
    v-if="needsName"
    class="min-h-screen bg-green-900 text-white flex flex-col items-center justify-center p-4"
  >
    <h1 class="text-2xl font-bold mb-6">ルーム {{ roomId }} に参加</h1>
    <input
      v-model="nameInput"
      type="text"
      placeholder="名前を入力"
      maxlength="10"
      class="px-4 py-3 rounded-xl text-gray-900 text-center text-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 mb-4 w-full max-w-xs"
      @keydown.enter="joinWithName"
    />
    <button
      :disabled="!nameInput.trim()"
      class="px-6 py-3 rounded-xl font-semibold transition-colors"
      :class="
        nameInput.trim()
          ? 'bg-yellow-500 hover:bg-yellow-600 text-white cursor-pointer'
          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
      "
      @click="joinWithName"
    >
      参加する
    </button>
    <router-link to="/" class="text-green-300 underline text-sm mt-4">トップに戻る</router-link>
  </div>

  <!-- Connecting -->
  <div
    v-else-if="!room"
    class="min-h-screen bg-green-900 text-white flex flex-col items-center justify-center p-4"
  >
    <p v-if="!connected" class="animate-pulse">接続中…</p>
    <p v-else class="animate-pulse">ルーム情報を取得中…</p>
    <p v-if="error" class="text-red-400 mt-2">{{ error }}</p>
    <router-link to="/" class="text-green-300 underline text-sm mt-4">トップに戻る</router-link>
  </div>

  <!-- Destroyed room -->
  <div
    v-else-if="room.phase === 'destroyed'"
    class="min-h-screen bg-green-900 text-white flex flex-col items-center justify-center p-4"
  >
    <div class="bg-white rounded-2xl shadow-xl p-8 text-center max-w-sm w-full mx-4">
      <div class="text-4xl mb-3">🚫</div>
      <h2 class="text-xl font-bold mb-2 text-gray-800">ルームは破棄されました</h2>
      <p class="text-gray-500 mb-6 text-sm">
        ルームを作成したプレイヤーが退出したため、このルームは利用できません。
      </p>
      <router-link
        to="/"
        class="inline-block px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors"
      >
        トップに戻る
      </router-link>
    </div>
  </div>

  <!-- Waiting room (lobby) -->
  <div
    v-else-if="room.phase === 'waiting'"
    class="min-h-screen bg-green-900 text-white p-2 sm:p-4 flex flex-col gap-4"
  >
    <h1 class="text-center text-xl sm:text-2xl font-bold">7並べ オンライン</h1>
    <Lobby :room="room" @start="startGame" />
    <div class="text-center">
      <router-link to="/" class="text-green-300 underline text-sm">トップに戻る</router-link>
    </div>
  </div>

  <!-- Playing / Game Over -->
  <div v-else class="min-h-screen bg-green-900 text-white p-2 sm:p-4 flex flex-col gap-2 sm:gap-4">
    <div class="flex items-center justify-center relative">
      <h1 class="text-xl sm:text-2xl font-bold">7並べ オンライン</h1>
      <button
        class="absolute right-0 text-green-300 underline text-sm cursor-pointer"
        @click="showLeaveConfirm = true"
      >
        退出
      </button>
    </div>

    <div class="flex justify-center gap-3 flex-wrap">
      <PlayerSeat
        v-for="seat in room.seats"
        :key="seat.index"
        :seat="seat"
        :is-current-turn="room.game !== null && room.game.currentSeatIndex === seat.index"
        :hand-count="room.game?.handCounts[seat.index]"
        :passes-used="room.game?.passesUsed[seat.index]"
        :eliminated="room.game?.eliminated[seat.index]"
        :is-me="seat.index === room.mySeatIndex"
      />
    </div>

    <TurnTimer :remaining="turnTimeRemaining" />

    <div v-if="room.game" class="bg-green-800 rounded-xl p-2 sm:p-3 flex flex-col gap-1 sm:gap-1.5">
      <BoardRow
        v-for="suit in SUITS"
        :key="suit"
        :board-suit="room.game.board[suit]"
        :joker-targets="validJokerPositions"
        :combo-highlight-targets="comboHighlightPositions"
        @joker-place="handleJokerPlace"
      />
    </div>

    <!-- Status -->
    <div
      class="text-center py-2 px-4 rounded-lg text-sm font-medium min-h-[2.25rem] flex items-center justify-center"
      :class="isMyTurn ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'"
      role="status"
      aria-live="polite"
    >
      <template v-if="gameStatus === 'online-other-turn'">{{ currentPlayerName }}のターン</template>
      <template v-else-if="gameStatus === 'human-eliminated'"
        >パスの上限に達しました。脱落です…</template
      >
      <template v-else-if="gameStatus === 'human-place'">カードを選んで置いてください</template>
      <template v-else-if="gameStatus === 'human-must-pass'"
        >置けるカードがありません。パスしてください</template
      >
      <template v-else-if="gameStatus === 'human-joker-or-pass'"
        >置けるカードがありません。ジョーカーを出すかパスしてください</template
      >
      <template v-else-if="gameStatus === 'human-joker-mode'"
        >ジョーカーを置く場所を選んでください</template
      >
      <template v-else-if="gameStatus === 'human-joker-combo-select'"
        >ジョーカーと一緒にカードを出しますか？</template
      >
      <template v-else-if="gameStatus === 'human-turn'">あなたのターン</template>
      <template v-else>待機中…</template>
    </div>

    <!-- Hand -->
    <div v-if="room.game && room.mySeatIndex !== null" class="bg-green-800 rounded-xl p-2 sm:p-3">
      <div class="text-xs text-center mb-2 text-green-300">
        <template v-if="room.game.eliminated[room.mySeatIndex]"> あなた — 脱落 </template>
        <template v-else>
          あなたの手札（{{ room.game.myHand.length }}枚） — パス残り
          {{ MAX_PASSES - (room.game.passesUsed[room.mySeatIndex] ?? 0) }}/{{ MAX_PASSES }}
        </template>
      </div>
      <PlayerHand
        :hand="room.game.myHand"
        :valid-cards="validCards"
        :disabled="!isMyTurn"
        :joker-mode="jokerMode"
        @play="playCard"
        @select-joker="enterJokerMode"
      />
    </div>

    <!-- Action buttons -->
    <div class="flex gap-2 justify-center flex-wrap">
      <template v-if="selectedJokerComboOption">
        <button
          class="px-4 py-2 rounded-lg bg-yellow-500 text-white font-medium hover:bg-yellow-600 transition-colors cursor-pointer"
          @click="confirmJokerCombo"
        >
          コンボで出す（ジョーカー +
          {{ getCompanionLabel(selectedJokerComboOption?.companionCard) }}）
        </button>
        <button
          class="px-4 py-2 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors cursor-pointer"
          @click="confirmJokerAlone"
        >
          ジョーカーのみ
        </button>
      </template>
      <button
        v-if="jokerMode"
        class="px-4 py-2 rounded-lg bg-gray-500 text-white font-medium hover:bg-gray-600 transition-colors cursor-pointer"
        @click="cancelJokerMode"
      >
        {{ selectedJokerPos ? "位置を選び直す" : "キャンセル" }}
      </button>
      <button
        :disabled="!canPassTurn || !isMyTurn || jokerMode"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        :class="
          canPassTurn && isMyTurn && !jokerMode
            ? 'bg-yellow-400 hover:bg-yellow-500 text-white cursor-pointer'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        "
        @click="pass"
      >
        パス
      </button>
    </div>

    <!-- Game over modal -->
    <div
      v-if="room.phase === 'gameover' && winnerSeatIndex !== null"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
    >
      <div class="bg-white rounded-2xl shadow-xl p-8 text-center max-w-sm w-full mx-4">
        <div class="text-4xl mb-3">{{ isMyWin ? "🎉" : "😢" }}</div>
        <h2 class="text-2xl font-bold mb-2">
          {{ isMyWin ? "勝利！" : "ゲームオーバー" }}
        </h2>
        <p class="text-gray-600 mb-6">{{ winnerName }}が上がりました！</p>
        <button
          class="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors cursor-pointer"
          @click="backToHome"
        >
          トップに戻る
        </button>
      </div>
    </div>

    <JokerReceivedOverlay v-if="showJokerNotification" @close="dismissJokerNotification" />

    <ConfirmModal
      v-if="showLeaveConfirm"
      title="ルームを退出"
      message="退出すると、ゲームに戻ることはできません。退出しますか？"
      confirm-text="退出する"
      cancel-text="キャンセル"
      is-dangerous
      @confirm="backToHome"
      @cancel="showLeaveConfirm = false"
    />

    <p v-if="error" class="text-center text-red-400 text-sm">{{ error }}</p>
  </div>
</template>
