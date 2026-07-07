import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";
import "./Textarea.css";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error = false, className, rows = 4, ...rest }, ref) => {
    const classes = ["wmx-textarea", error ? "wmx-textarea--error" : "", className]
      .filter(Boolean)
      .join(" ");

    return <textarea ref={ref} className={classes} rows={rows} {...rest} />;
  }
);

Textarea.displayName = "Textarea";
