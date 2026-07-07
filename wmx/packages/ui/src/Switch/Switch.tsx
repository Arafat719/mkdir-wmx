import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import "./Switch.css";

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: ReactNode;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, className, id, ...rest }, ref) => {
    const classes = ["wmx-switch", className].filter(Boolean).join(" ");

    return (
      <label className={classes} htmlFor={id}>
        <input ref={ref} type="checkbox" role="switch" id={id} className="wmx-switch__input" {...rest} />
        <span className="wmx-switch__track" aria-hidden="true">
          <span className="wmx-switch__thumb" />
        </span>
        {label && <span className="wmx-switch__label">{label}</span>}
      </label>
    );
  }
);

Switch.displayName = "Switch";
