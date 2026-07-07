import type { HTMLAttributes } from "react";
import "./Progress.css";

export type ProgressVariant = "primary" | "success" | "warning" | "danger";

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  variant?: ProgressVariant;
  showLabel?: boolean;
}

export function Progress({
  value,
  max = 100,
  variant = "primary",
  showLabel = false,
  className,
  ...rest
}: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const classes = ["wmx-progress", className].filter(Boolean).join(" ");

  return (
    <div className={classes} {...rest}>
      <div
        className="wmx-progress__track"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div className={`wmx-progress__fill wmx-progress__fill--${variant}`} style={{ width: `${pct}%` }} />
      </div>
      {showLabel && <span className="wmx-progress__label">{Math.round(pct)}%</span>}
    </div>
  );
}
