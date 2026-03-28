export function useLocalStorage<T>(key: string, defaultValue: T) {
  // SSR時はlocalStorageが存在しないため、クライアント側でのみアクセスする
  const stored = import.meta.client ? localStorage.getItem(key) : null;
  const initial = stored ? (JSON.parse(stored) as T) : defaultValue;

  const state = useState<T>(key, () => initial);

  watch(
    state,
    (val) => {
      if (import.meta.client) {
        // SSR時はlocalStorageが存在しないため
        localStorage.setItem(key, JSON.stringify(val));
      }
    },
    { deep: true },
  );

  return state;
}
