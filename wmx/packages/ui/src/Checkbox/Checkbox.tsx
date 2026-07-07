import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import "./Checkbox.css";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className, id, ...rest }, ref) => {
    const classes = ["wmx-checkbox", className].filter(Boolean).join(" ");

    return (
      <label className={classes} htmlFor={id}>
        <input ref={ref} type="checkbox" id={id} className="wmx-checkbox__input" {...rest} />
        <span className="wmx-checkbox__box" aria-hidden="true">
          <svg viewBox="0 0 12 10" fill="none">
            <path d="M1 5L4.5 8.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        {label && <span className="wmx-checkbox__label">{label}</span>}
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";
