import { useRef } from "react";
import { createPortal } from "react-dom";
import type { HTMLAttributes, ReactNode } from "react";
import { useModalBehavior } from "../useModalBehavior.js";
import { useFocusTrap } from "../useFocusTrap.js";
import "./Modal.css";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

export interface ModalProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  size?: ModalSize;
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  children: ReactNode;
}

export function Modal({
  isOpen,
  onClose,
  title,
  size = "md",
  closeOnOverlayClick = true,
  closeOnEsc = true,
  className,
  children,
  ...rest
}: ModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useModalBehavior({ isOpen, onClose, closeOnEsc });
  useFocusTrap(containerRef, isOpen);

  if (!isOpen) return null;

  const classes = ["wmx-dialog", `wmx-dialog--${size}`, className].filter(Boolean).join(" ");

  return createPortal(
    <div className="wmx-dialog-overlay" onClick={closeOnOverlayClick ? onClose : undefined}>
      <div
        ref={containerRef}
        className={classes}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        {...rest}
      >
        <div className="wmx-dialog__header">
          {title && <span className="wmx-dialog__title">{title}</span>}
          <button type="button" className="wmx-dialog__close" aria-label="Close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="wmx-dialog__body">{children}</div>
      </div>
    </div>,
    document.body
  );
}
