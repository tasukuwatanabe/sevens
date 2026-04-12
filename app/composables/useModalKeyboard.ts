import { ref, onMounted, onUnmounted } from "vue";

export function useModalKeyboard(onEscape: () => void) {
  const buttonRef = ref<HTMLElement | null>(null);

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") onEscape();
  }

  onMounted(() => {
    buttonRef.value?.focus();
    document.addEventListener("keydown", handleKeyDown);
  });

  onUnmounted(() => {
    document.removeEventListener("keydown", handleKeyDown);
  });

  return { buttonRef };
}
