type ToastType = "success" | "error" | "info" | "warning";

interface ToastOptions {
  duration?: number;
}

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

type Listener = (toasts: ToastMessage[]) => void;

let toasts: ToastMessage[] = [];
const listeners: Set<Listener> = new Set();

function notify() {
  listeners.forEach((listener) => listener([...toasts]));
}

export function subscribeToasts(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function addToast(type: ToastType, message: string, options?: ToastOptions) {
  const id = Math.random().toString(36).slice(2, 9);
  const newToast: ToastMessage = { id, type, message };
  toasts = [...toasts, newToast];
  notify();

  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  }, options?.duration ?? 4000);
}

export const toast = {
  success: (message: string, options?: ToastOptions) => addToast("success", message, options),
  error: (message: string, options?: ToastOptions) => addToast("error", message, options),
  info: (message: string, options?: ToastOptions) => addToast("info", message, options),
  warning: (message: string, options?: ToastOptions) => addToast("warning", message, options),
};
