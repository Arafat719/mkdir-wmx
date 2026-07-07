import { useCallback, useMemo, useState } from "react";
import type { ChangeEvent, FocusEvent, FormEvent } from "react";

export type Validator<V = unknown> = (value: V, values: Record<string, unknown>) => string | undefined;

type FieldElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

export interface UseFormOptions<T extends Record<string, unknown>> {
  initialValues: T;
  validators?: Partial<{ [K in keyof T]: Validator<T[K]> | Validator<T[K]>[] }>;
  onSubmit: (values: T) => void | Promise<void>;
}

export interface UseFormReturn<T extends Record<string, unknown>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
  handleChange: (e: ChangeEvent<FieldElement>) => void;
  handleBlur: (e: FocusEvent<FieldElement>) => void;
  handleSubmit: (e?: FormEvent<HTMLFormElement>) => void;
  setFieldValue: (name: keyof T, value: T[keyof T]) => void;
  setFieldError: (name: keyof T, error: string | undefined) => void;
  resetForm: () => void;
}

function runValidators<V>(
  value: V,
  values: Record<string, unknown>,
  validator?: Validator<V> | Validator<V>[]
): string | undefined {
  if (!validator) return undefined;
  const list = Array.isArray(validator) ? validator : [validator];
  for (const fn of list) {
    const error = fn(value, values);
    if (error) return error;
  }
  return undefined;
}

export function useForm<T extends Record<string, unknown>>({
  initialValues,
  validators,
  onSubmit,
}: UseFormOptions<T>): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateAll = useCallback(
    (nextValues: T) => {
      const nextErrors: Partial<Record<keyof T, string>> = {};
      for (const key of Object.keys(nextValues) as (keyof T)[]) {
        const error = runValidators(nextValues[key], nextValues, validators?.[key]);
        if (error) nextErrors[key] = error;
      }
      return nextErrors;
    },
    [validators]
  );

  const handleChange = useCallback(
    (e: ChangeEvent<FieldElement>) => {
      const target = e.target;
      const name = target.name as keyof T;
      const nextValue = (
        target instanceof HTMLInputElement && target.type === "checkbox" ? target.checked : target.value
      ) as T[keyof T];

      const nextValues = { ...values, [name]: nextValue };
      setValues(nextValues);

      if (touched[name]) {
        setErrors((prev) => ({ ...prev, [name]: runValidators(nextValue, nextValues, validators?.[name]) }));
      }
    },
    [values, touched, validators]
  );

  const handleBlur = useCallback(
    (e: FocusEvent<FieldElement>) => {
      const name = e.target.name as keyof T;
      setTouched((prev) => ({ ...prev, [name]: true }));
      setErrors((prev) => ({ ...prev, [name]: runValidators(values[name], values, validators?.[name]) }));
    },
    [validators, values]
  );

  const setFieldValue = useCallback((name: keyof T, value: T[keyof T]) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const setFieldError = useCallback((name: keyof T, error: string | undefined) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, []);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const handleSubmit = useCallback(
    (e?: FormEvent<HTMLFormElement>) => {
      e?.preventDefault();
      const nextErrors = validateAll(values);
      setErrors(nextErrors);
      setTouched(
        Object.keys(values).reduce(
          (acc, key) => ({ ...acc, [key]: true }),
          {} as Partial<Record<keyof T, boolean>>
        )
      );
      if (Object.keys(nextErrors).length > 0) return;

      setIsSubmitting(true);
      Promise.resolve(onSubmit(values)).finally(() => setIsSubmitting(false));
    },
    [onSubmit, validateAll, values]
  );

  const isValid = useMemo(() => Object.keys(validateAll(values)).length === 0, [validateAll, values]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    resetForm,
  };
}
