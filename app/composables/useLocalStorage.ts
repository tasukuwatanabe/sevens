export function useLocalStorage<T>(key: string, defaultValue: T) {
  const state = useState<T>(key, () => defaultValue);

  onMounted(() => {
    const stored = localStorage.getItem(key);
    if (stored) {
      state.value = JSON.parse(stored) as T;
    }
  });

  watch(
    state,
    (val) => {
      if (import.meta.client) {
        localStorage.setItem(key, JSON.stringify(val));
      }
    },
    { deep: true },
  );

  return state;
}
