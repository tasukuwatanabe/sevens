import { ref, onMounted, watch } from "vue";

export function useLocalStorage<T>(key: string, defaultValue: T) {
  const state = ref<T>(defaultValue);

  onMounted(() => {
    const stored = localStorage.getItem(key);
    if (stored) {
      state.value = JSON.parse(stored) as T;
    }
  });

  watch(
    state,
    (val) => {
      localStorage.setItem(key, JSON.stringify(val));
    },
    { deep: true },
  );

  return state;
}
