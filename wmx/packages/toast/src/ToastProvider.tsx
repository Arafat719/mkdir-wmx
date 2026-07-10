import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
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

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  action?: ToastAction;
}

type InternalVariant = ToastVariant | "loading";

interface ToastItem {
  id: string;
  title?: string;
  description?: string;
  variant: InternalVariant;
  duration: number;
  action?: ToastAction;
}

export interface ToastProviderProps {
  children: ReactNode;
  position?: ToastPosition;
}

type VariantHelper = (description: string, options?: Omit<ToastOptions, "description" | "variant">) => string;

export interface PromiseToastOptions<T> {
  loading?: ToastOptions;
  success: ToastOptions | ((data: T) => ToastOptions);
  error: ToastOptions | ((error: unknown) => ToastOptions);
}

export interface ToastContextValue {
  toast: (options: ToastOptions) => string;
  success: VariantHelper;
  error: VariantHelper;
  warning: VariantHelper;
  info: VariantHelper;
  /** Shows a loading toast immediately, then swaps it to the success/error outcome once the promise settles. */
  promise: <T>(promise: Promise<T>, options: PromiseToastOptions<T>) => Promise<T>;
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

interface TimerEntry {
  handle: ReturnType<typeof setTimeout>;
  startedAt: number;
  remaining: number;
}

export function ToastProvider({ children, position = "bottom-right" }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<string, TimerEntry>());

  useEffect(() => {
    const activeTimers = timers.current;
    return () => {
      activeTimers.forEach((timer) => clearTimeout(timer.handle));
      activeTimers.clear();
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer.handle);
      timers.current.delete(id);
    }
  }, []);

  const scheduleDismiss = useCallback(
    (id: string, duration: number) => {
      if (duration <= 0) return;
      timers.current.set(id, {
        handle: setTimeout(() => dismiss(id), duration),
        startedAt: Date.now(),
        remaining: duration,
      });
    },
    [dismiss]
  );

  /** Pauses both the dismiss timer and (via CSS `:hover`) the progress bar animation. */
  const pause = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (!timer) return;
    clearTimeout(timer.handle);
    timer.remaining = Math.max(timer.remaining - (Date.now() - timer.startedAt), 0);
  }, []);

  const resume = useCallback(
    (id: string) => {
      const timer = timers.current.get(id);
      if (!timer || timer.remaining <= 0) return;
      timer.startedAt = Date.now();
      timer.handle = setTimeout(() => dismiss(id), timer.remaining);
    },
    [dismiss]
  );

  const toast = useCallback(
    (options: ToastOptions) => {
      const id = `wmx-toast-${++uid}`;
      const duration = options.duration ?? 4000;

      setToasts((prev) => [
        ...prev,
        {
          id,
          title: options.title,
          description: options.description,
          variant: options.variant ?? "info",
          duration,
          action: options.action,
        },
      ]);

      scheduleDismiss(id, duration);
      return id;
    },
    [scheduleDismiss]
  );

  const update = useCallback(
    (id: string, options: ToastOptions & { variant: ToastVariant }) => {
      const duration = options.duration ?? 4000;
      setToasts((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                title: options.title,
                description: options.description,
                variant: options.variant,
                duration,
                action: options.action,
              }
            : t
        )
      );
      scheduleDismiss(id, duration);
    },
    [scheduleDismiss]
  );

  const promiseToast = useCallback(
    <T,>(pending: Promise<T>, options: PromiseToastOptions<T>): Promise<T> => {
      const id = `wmx-toast-${++uid}`;
      const loadingOptions = options.loading ?? {};
      setToasts((prev) => [
        ...prev,
        {
          id,
          title: loadingOptions.title ?? "Loading…",
          description: loadingOptions.description,
          variant: "loading",
          duration: 0,
        },
      ]);

      return pending.then(
        (data) => {
          const resolved = typeof options.success === "function" ? options.success(data) : options.success;
          update(id, { ...resolved, variant: resolved.variant ?? "success" });
          return data;
        },
        (err: unknown) => {
          const resolved = typeof options.error === "function" ? options.error(err) : options.error;
          update(id, { ...resolved, variant: resolved.variant ?? "error" });
          throw err;
        }
      );
    },
    [update]
  );

  const dismissAll = useCallback(() => {
    timers.current.forEach((timer) => clearTimeout(timer.handle));
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
    () => ({ toast, success, error, warning, info, promise: promiseToast, dismiss, dismissAll }),
    [toast, success, error, warning, info, promiseToast, dismiss, dismissAll]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={`wmx-toast-viewport wmx-toast-viewport--${position}`}>
        {toasts.map((t) => {
          const isLoading = t.variant === "loading";
          return (
            <div
              key={t.id}
              className={`wmx-toast wmx-toast--${t.variant}`}
              role="status"
              onMouseEnter={() => pause(t.id)}
              onMouseLeave={() => resume(t.id)}
            >
              <span className="wmx-toast__icon" aria-hidden="true">
                {isLoading ? <span className="wmx-toast__spinner" /> : ICONS[t.variant as ToastVariant]}
              </span>
              <div className="wmx-toast__content">
                {t.title && <div className="wmx-toast__title">{t.title}</div>}
                {t.description && <div className="wmx-toast__description">{t.description}</div>}
                {t.action && (
                  <button
                    type="button"
                    className="wmx-toast__action"
                    onClick={() => {
                      t.action?.onClick();
                      dismiss(t.id);
                    }}
                  >
                    {t.action.label}
                  </button>
                )}
              </div>
              {!isLoading && (
                <button
                  type="button"
                  className="wmx-toast__close"
                  aria-label="Dismiss"
                  onClick={() => dismiss(t.id)}
                >
                  &times;
                </button>
              )}
              {!isLoading && t.duration > 0 && (
                <span className="wmx-toast__progress">
                  <span className="wmx-toast__progress-bar" style={{ animationDuration: `${t.duration}ms` }} />
                </span>
              )}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
