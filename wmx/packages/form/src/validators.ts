import type { Validator } from "./useForm.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function required(message = "This field is required"): Validator<unknown> {
  return (value) => {
    if (value === undefined || value === null || value === "" || value === false) return message;
    return undefined;
  };
}

export function email(message = "Enter a valid email address"): Validator<string> {
  return (value) => {
    if (!value) return undefined;
    return EMAIL_RE.test(value) ? undefined : message;
  };
}

export function minLength(min: number, message = `Must be at least ${min} characters`): Validator<string> {
  return (value) => {
    if (!value) return undefined;
    return value.length >= min ? undefined : message;
  };
}

export function maxLength(max: number, message = `Must be at most ${max} characters`): Validator<string> {
  return (value) => {
    if (!value) return undefined;
    return value.length <= max ? undefined : message;
  };
}

export function pattern(regex: RegExp, message = "Invalid format"): Validator<string> {
  return (value) => {
    if (!value) return undefined;
    return regex.test(value) ? undefined : message;
  };
}

export function min(minValue: number, message = `Must be at least ${minValue}`): Validator<number | string> {
  return (value) => {
    if (value === undefined || value === null || value === "") return undefined;
    return Number(value) >= minValue ? undefined : message;
  };
}

export function max(maxValue: number, message = `Must be at most ${maxValue}`): Validator<number | string> {
  return (value) => {
    if (value === undefined || value === null || value === "") return undefined;
    return Number(value) <= maxValue ? undefined : message;
  };
}

export function matches(fieldName: string, message = "Fields do not match"): Validator<unknown> {
  return (value, values) => (value === values[fieldName] ? undefined : message);
}
