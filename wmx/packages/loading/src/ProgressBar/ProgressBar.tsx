import type { HTMLAttributes, ReactNode } from "react";
import "./ProgressBar.css";

export type ProgressBarSize = "sm" | "md" | "lg";

export interface ProgressBarProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** 0–100. Omit for an indeterminate sliding bar when the total isn't known yet. */
  value?: number;
  label?: ReactNode;
  /** Renders the percentage next to the label. Ignored when `value` is omitted. */
  showValue?: boolean;
  size?: ProgressBarSize;
}

export function ProgressBar({
  value,
  label,
  showValue = false,
  size = "md",
  className,
  ...rest
}: ProgressBarProps) {
  const clamped = value == null ? undefined : Math.min(100, Math.max(0, value));
  const classes = ["wmx-progress", className].filter(Boolean).join(" ");

  return (
    <div
      className={classes}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      {...rest}
    >
      {(label || (showValue && clamped != null)) && (
        <div className="wmx-progress__label-row">
          {label && <span className="wmx-progress__label">{label}</span>}
          {showValue && clamped != null && (
            <span className="wmx-progress__value">{Math.round(clamped)}%</span>
          )}
        </div>
      )}
      <div className={`wmx-progress__track wmx-progress__track--${size}`}>
        <div
          className={`wmx-progress__bar${clamped == null ? " wmx-progress__bar--indeterminate" : ""}`}
          style={clamped == null ? undefined : { width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
