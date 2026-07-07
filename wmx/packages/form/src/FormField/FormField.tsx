import type { ReactNode } from "react";
import "./FormField.css";

export interface FormFieldProps {
  label?: ReactNode;
  htmlFor?: string;
  error?: string;
  touched?: boolean;
  hint?: ReactNode;
  required?: boolean;
  children: ReactNode;
}

export function FormField({
  label,
  htmlFor,
  error,
  touched = true,
  hint,
  required,
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
      {children}
      {showError ? (
        <span className="wmx-form-field__error">{error}</span>
      ) : hint ? (
        <span className="wmx-form-field__hint">{hint}</span>
      ) : null}
    </div>
  );
}
