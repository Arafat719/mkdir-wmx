import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client";
import "./Confirm.css";

export interface ConfirmOptions {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "danger";
  /**
   * If provided, the confirm button runs this itself instead of resolving immediately: it
   * shows a spinner and disables both buttons while pending, and if it throws, the dialog
   * stays open with the error shown inline so the user can retry.
   */
  onConfirm?: () => void | Promise<void>;
}

interface ConfirmDialogProps extends ConfirmOptions {
  onResolve: (result: boolean) => void;
}

function ConfirmDialog({
  title = "Are you sure?",
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  onConfirm,
  onResolve,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onResolve(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onResolve, busy]);

  const handleCancel = () => {
    if (busy) return;
    onResolve(false);
  };

  const handleConfirm = () => {
    if (!onConfirm) {
      onResolve(true);
      return;
    }
    setBusy(true);
    setError(null);
    Promise.resolve()
      .then(() => onConfirm())
      .then(() => onResolve(true))
      .catch((err: unknown) => {
        setBusy(false);
        setError(err instanceof Error ? err.message : String(err));
      });
  };

  return createPortal(
    <div className="wmx-confirm-overlay" onClick={handleCancel}>
      <div
        className="wmx-confirm"
        role="alertdialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="wmx-confirm__title">{title}</div>
        {description && <div className="wmx-confirm__description">{description}</div>}
        {error && <div className="wmx-confirm__error">{error}</div>}
        <div className="wmx-confirm__actions">
          <button
            type="button"
            className="wmx-confirm__btn wmx-confirm__btn--cancel"
            onClick={handleCancel}
            disabled={busy}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`wmx-confirm__btn wmx-confirm__btn--${variant === "danger" ? "danger" : "confirm"}`}
            onClick={handleConfirm}
            disabled={busy}
          >
            {busy && <span className="wmx-confirm__spinner" aria-hidden="true" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function confirm(options: ConfirmOptions = {}): Promise<boolean> {
  return new Promise((resolve) => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    const handleResolve = (result: boolean) => {
      // Defer unmount so we don't synchronously tear down the root while React
      // is still dispatching the click/keydown event that triggered it.
      setTimeout(() => {
        root.unmount();
        container.remove();
      }, 0);
      resolve(result);
    };

    root.render(<ConfirmDialog {...options} onResolve={handleResolve} />);
  });
}
