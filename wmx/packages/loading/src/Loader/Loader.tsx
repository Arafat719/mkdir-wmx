import type { HTMLAttributes, ReactNode } from "react";
import { Spinner } from "../Spinner/Spinner.js";
import type { SpinnerVariant } from "../Spinner/Spinner.js";
import "./Loader.css";

export interface LoaderProps extends HTMLAttributes<HTMLDivElement> {
  visible: boolean;
  label?: ReactNode;
  fullScreen?: boolean;
  spinnerVariant?: SpinnerVariant;
}

export function Loader({
  visible,
  label,
  fullScreen = false,
  spinnerVariant = "ring",
  className,
  ...rest
}: LoaderProps) {
  if (!visible) return null;

  const classes = ["wmx-loader", fullScreen && "wmx-loader--full", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} role="status" aria-live="polite" {...rest}>
      <Spinner variant={spinnerVariant} size="lg" />
      {label && <span className="wmx-loader__label">{label}</span>}
    </div>
  );
}
