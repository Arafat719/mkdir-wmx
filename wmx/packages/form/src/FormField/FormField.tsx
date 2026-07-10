import type { ReactNode } from "react";
import "./FormField.css";

export interface FormFieldProps {
  label?: ReactNode;
  htmlFor?: string;
  error?: string;
  touched?: boolean;
  hint?: ReactNode;
  required?: boolean;
  /** Leading glyph rendered inside the control, e.g. an icon from wmx-icons. */
  icon?: ReactNode;
  /** Trailing slot inside the control — a show/hide toggle, an inline spinner, a checkmark. */
  endAdornment?: ReactNode;
  children: ReactNode;
}

export function FormField({
  label,
  htmlFor,
  error,
  touched = true,
  hint,
  required,
  icon,
  endAdornment,
  children,
}: FormFieldProps) {
  const showError = Boolean(error) && touched;

  return (
    <div className={`wmx-form-field${showError ? " wmx-form-field--error" : ""}`}>
      {label && (
        <label className="wmx-form-field__label" htmlFor={htmlFor}>
          {label}
          {required && <span className="wmx-form-field__required">*</span>}
        </label>
      )}
      <div className={`wmx-form-field__control${icon ? " has-icon" : ""}${endAdornment ? " has-end" : ""}`}>
        {icon && <span className="wmx-form-field__icon">{icon}</span>}
        {children}
        {endAdornment && <span className="wmx-form-field__end">{endAdornment}</span>}
      </div>
      {showError ? (
        <span className="wmx-form-field__error">{error}</span>
      ) : hint ? (
        <span className="wmx-form-field__hint">{hint}</span>
      ) : null}
    </div>
  );
}
