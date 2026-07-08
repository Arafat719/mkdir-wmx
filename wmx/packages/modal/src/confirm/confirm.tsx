import { useEffect } from "react";
import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client";
import "./Confirm.css";

export interface ConfirmOptions {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "danger";
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
  onResolve,
}: ConfirmDialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onResolve(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onResolve]);

  return createPortal(
    <div className="wmx-confirm-overlay" onClick={() => onResolve(false)}>
      <div
        className="wmx-confirm"
        role="alertdialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="wmx-confirm__title">{title}</div>
        {description && <div className="wmx-confirm__description">{description}</div>}
        <div className="wmx-confirm__actions">
          <button
            type="button"
            className="wmx-confirm__btn wmx-confirm__btn--cancel"
            onClick={() => onResolve(false)}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`wmx-confirm__btn wmx-confirm__btn--${variant === "danger" ? "danger" : "confirm"}`}
            onClick={() => onResolve(true)}
          >
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
