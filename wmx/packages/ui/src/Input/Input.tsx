import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import "./Input.css";

export type InputSize = "sm" | "md" | "lg";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: InputSize;
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ size = "md", error = false, className, ...rest }, ref) => {
    const classes = [
      "wmx-input",
      `wmx-input--${size}`,
      error ? "wmx-input--error" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return <input ref={ref} className={classes} {...rest} />;
  }
);

Input.displayName = "Input";
