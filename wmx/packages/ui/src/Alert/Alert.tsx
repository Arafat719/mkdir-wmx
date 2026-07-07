import type { HTMLAttributes, ReactNode } from "react";
import "./Alert.css";

export type AlertVariant = "info" | "success" | "warning" | "danger";

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  variant?: AlertVariant;
  title?: ReactNode;
  onClose?: () => void;
  children: ReactNode;
}

const ICONS: Record<AlertVariant, string> = {
  info: "ⓘ",
  success: "✓",
  warning: "!",
  danger: "✕",
};

export function Alert({ variant = "info", title, onClose, className, children, ...rest }: AlertProps) {
  const classes = ["wmx-alert", `wmx-alert--${variant}`, className].filter(Boolean).join(" ");

  return (
    <div className={classes} role="alert" {...rest}>
      <span className="wmx-alert__icon" aria-hidden="true">{ICONS[variant]}</span>
      <div className="wmx-alert__content">
        {title && <div className="wmx-alert__title">{title}</div>}
        <div className="wmx-alert__body">{children}</div>
      </div>
      {onClose && (
        <button type="button" className="wmx-alert__close" aria-label="Dismiss" onClick={onClose}>
          &times;
        </button>
      )}
    </div>
  );
}
