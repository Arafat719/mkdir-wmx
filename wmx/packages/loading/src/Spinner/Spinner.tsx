import type { HTMLAttributes } from "react";
import "./Spinner.css";

export type SpinnerVariant = "ring" | "dots" | "bars" | "pulse";
export type SpinnerSize = "sm" | "md" | "lg";

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: SpinnerVariant;
  size?: SpinnerSize;
}

export function Spinner({ variant = "ring", size = "md", className, ...rest }: SpinnerProps) {
  const classes = ["wmx-spin", `wmx-spin--${variant}`, `wmx-spin--${size}`, className]
    .filter(Boolean)
    .join(" ");

  if (variant === "dots") {
    return (
      <span className={classes} role="status" aria-label="Loading" {...rest}>
        <span className="wmx-spin__dot" />
        <span className="wmx-spin__dot" />
        <span className="wmx-spin__dot" />
      </span>
    );
  }

  if (variant === "bars") {
    return (
      <span className={classes} role="status" aria-label="Loading" {...rest}>
        <span className="wmx-spin__bar" />
        <span className="wmx-spin__bar" />
        <span className="wmx-spin__bar" />
        <span className="wmx-spin__bar" />
      </span>
    );
  }

  return <span className={classes} role="status" aria-label="Loading" {...rest} />;
}
