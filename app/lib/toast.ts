export type Toast = { id: number; text: string; tone: "ok" | "error" };

let toasts: Toast[] = [];
const listeners = new Set<() => void>();
let next = 1;

const emit = () => listeners.forEach((l) => l());

export const getToasts = () => toasts;
// снимок должен быть одной и той же ссылкой, иначе React решит, что данные всё время меняются
const NO_TOASTS: Toast[] = [];
export const getServerToasts = () => NO_TOASTS;

export const subscribeToasts = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const toast = (text: string, tone: Toast["tone"] = "ok") => {
  const id = next++;
  toasts = [...toasts, { id, text, tone }];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, 2600);
};
