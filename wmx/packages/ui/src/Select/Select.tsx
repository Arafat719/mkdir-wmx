import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";
import "./Select.css";

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export type SelectSize = "sm" | "md" | "lg";

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  options: SelectOption[];
  size?: SelectSize;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, size = "md", placeholder, className, ...rest }, ref) => {
    const classes = ["wmx-select", `wmx-select--${size}`, className]
      .filter(Boolean)
      .join(" ");

    return (
      <select ref={ref} className={classes} {...rest}>
        {placeholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }
);

Select.displayName = "Select";
