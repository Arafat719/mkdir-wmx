import type { HTMLAttributes } from "react";
import "./Spinner.css";

export type SpinnerSize = "sm" | "md" | "lg";

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: SpinnerSize;
  label?: string;
}

export function Spinner({ size = "md", label = "Loading", className, ...rest }: SpinnerProps) {
  const classes = ["wmx-spinner", `wmx-spinner--${size}`, className].filter(Boolean).join(" ");

  return (
    <span className={classes} role="status" aria-label={label} {...rest}>
      <span className="wmx-spinner__visually-hidden">{label}</span>
    </span>
  );
}
