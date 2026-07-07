import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import "./Toast.css";

export type ToastVariant = "info" | "success" | "warning" | "error";
export type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastItem {
  id: string;
  title?: string;
  description?: string;
  variant: ToastVariant;
}

export interface ToastProviderProps {
  children: ReactNode;
  position?: ToastPosition;
}

type VariantHelper = (description: string, options?: Omit<ToastOptions, "description" | "variant">) => string;

export interface ToastContextValue {
  toast: (options: ToastOptions) => string;
  success: VariantHelper;
  error: VariantHelper;
  warning: VariantHelper;
  info: VariantHelper;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastVariant, string> = {
  info: "ⓘ",
  success: "✓",
  warning: "▲",
  error: "✕",
};

let uid = 0;

export function ToastProvider({ children, position = "bottom-right" }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (options: ToastOptions) => {
      const id = `wmx-toast-${++uid}`;
      const duration = options.duration ?? 4000;

      setToasts((prev) => [
        ...prev,
        { id, title: options.title, description: options.description, variant: options.variant ?? "info" },
      ]);

      if (duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), duration)
        );
      }
      return id;
    },
    [dismiss]
  );

  const dismissAll = useCallback(() => {
    timers.current.forEach((timer) => clearTimeout(timer));
    timers.current.clear();
    setToasts([]);
  }, []);

  const makeVariant = useCallback(
    (variant: ToastVariant): VariantHelper =>
      (description, options) =>
        toast({ ...options, description, variant }),
    [toast]
  );

  const success = useMemo(() => makeVariant("success"), [makeVariant]);
  const error = useMemo(() => makeVariant("error"), [makeVariant]);
  const warning = useMemo(() => makeVariant("warning"), [makeVariant]);
  const info = useMemo(() => makeVariant("info"), [makeVariant]);

  const value = useMemo<ToastContextValue>(
    () => ({ toast, success, error, warning, info, dismiss, dismissAll }),
    [toast, success, error, warning, info, dismiss, dismissAll]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={`wmx-toast-viewport wmx-toast-viewport--${position}`}>
        {toasts.map((t) => (
          <div key={t.id} className={`wmx-toast wmx-toast--${t.variant}`} role="status">
            <span className="wmx-toast__icon" aria-hidden="true">
              {ICONS[t.variant]}
            </span>
            <div className="wmx-toast__content">
              {t.title && <div className="wmx-toast__title">{t.title}</div>}
              {t.description && <div className="wmx-toast__description">{t.description}</div>}
            </div>
            <button
              type="button"
              className="wmx-toast__close"
              aria-label="Dismiss"
              onClick={() => dismiss(t.id)}
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
