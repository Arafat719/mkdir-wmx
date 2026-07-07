import { useRef } from "react";
import { createPortal } from "react-dom";
import type { HTMLAttributes, ReactNode } from "react";
import { useModalBehavior } from "../useModalBehavior.js";
import { useFocusTrap } from "../useFocusTrap.js";
import "./Drawer.css";

export type DrawerPlacement = "left" | "right" | "top" | "bottom";

export interface DrawerProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  placement?: DrawerPlacement;
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  children: ReactNode;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  placement = "right",
  closeOnOverlayClick = true,
  closeOnEsc = true,
  className,
  children,
  ...rest
}: DrawerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useModalBehavior({ isOpen, onClose, closeOnEsc });
  useFocusTrap(containerRef, isOpen);

  if (!isOpen) return null;

  const classes = ["wmx-drawer", `wmx-drawer--${placement}`, className].filter(Boolean).join(" ");

  return createPortal(
    <div className="wmx-drawer-overlay" onClick={closeOnOverlayClick ? onClose : undefined}>
      <div
        ref={containerRef}
        className={classes}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        {...rest}
      >
        <div className="wmx-drawer__header">
          {title && <span className="wmx-drawer__title">{title}</span>}
          <button type="button" className="wmx-drawer__close" aria-label="Close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="wmx-drawer__body">{children}</div>
      </div>
    </div>,
    document.body
  );
}
