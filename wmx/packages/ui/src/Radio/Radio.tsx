import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import "./Radio.css";

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: ReactNode;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, className, id, ...rest }, ref) => {
    const classes = ["wmx-radio", className].filter(Boolean).join(" ");

    return (
      <label className={classes} htmlFor={id}>
        <input ref={ref} type="radio" id={id} className="wmx-radio__input" {...rest} />
        <span className="wmx-radio__dot" aria-hidden="true" />
        {label && <span className="wmx-radio__label">{label}</span>}
      </label>
    );
  }
);

Radio.displayName = "Radio";
