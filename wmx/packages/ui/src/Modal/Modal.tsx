import type { HTMLAttributes, ReactNode } from "react";
import "./Modal.css";

export interface ModalProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, title, className, children, ...rest }: ModalProps) {
  if (!isOpen) return null;

  const classes = ["wmx-modal", className].filter(Boolean).join(" ");

  return (
    <div className="wmx-modal-overlay" onClick={onClose}>
      <div className={classes} onClick={(e) => e.stopPropagation()} {...rest}>
        <div className="wmx-modal__header">
          {title && <span className="wmx-modal__title">{title}</span>}
          <button
            type="button"
            className="wmx-modal__close"
            aria-label="Close"
            onClick={onClose}
          >
            &times;
          </button>
        </div>
        <div className="wmx-modal__body">{children}</div>
      </div>
    </div>
  );
}
