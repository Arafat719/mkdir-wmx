import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FocusEvent, FormEvent } from "react";

export type Validator<V = unknown> = (
  value: V,
  values: Record<string, unknown>
) => string | undefined | Promise<string | undefined>;

type FieldElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

const ASYNC_VALIDATION_DEBOUNCE_MS = 300;

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
  /** True for a field while its async validator is pending (debounced, in flight). */
  isValidating: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  handleChange: (e: ChangeEvent<FieldElement>) => void;
  handleBlur: (e: FocusEvent<FieldElement>) => void;
  handleSubmit: (e?: FormEvent<HTMLFormElement>) => void;
  setFieldValue: (name: keyof T, value: T[keyof T]) => void;
  setFieldError: (name: keyof T, error: string | undefined) => void;
  resetForm: () => void;
}

function normalizeList<V>(validator?: Validator<V> | Validator<V>[]): Validator<V>[] {
  if (!validator) return [];
  return Array.isArray(validator) ? validator : [validator];
}

/**
 * A validator declared with the `async` keyword is detected without calling it, so its
 * invocation can be debounced instead of firing on every keystroke.
 */
function isAsyncValidator<V>(fn: Validator<V>): boolean {
  return (fn as { constructor: { name: string } }).constructor.name === "AsyncFunction";
}

function splitValidators<V>(list: Validator<V>[]): { syncFns: Validator<V>[]; asyncFn?: Validator<V> } {
  const syncFns: Validator<V>[] = [];
  for (const fn of list) {
    if (isAsyncValidator(fn)) return { syncFns, asyncFn: fn };
    syncFns.push(fn);
  }
  return { syncFns };
}

async function runValidatorsAsync<V>(
  value: V,
  values: Record<string, unknown>,
  validator?: Validator<V> | Validator<V>[]
): Promise<string | undefined> {
  for (const fn of normalizeList(validator)) {
    const result = await fn(value, values);
    if (result) return result;
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
  const [isValidating, setIsValidating] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const asyncTokens = useRef<Partial<Record<keyof T, number>>>({});
  const asyncTimers = useRef(new Map<keyof T, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const timers = asyncTimers.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const validateField = useCallback(
    (name: keyof T, value: T[keyof T], nextValues: T) => {
      const list = normalizeList(validators?.[name]);
      const { syncFns, asyncFn } = splitValidators(list);

      const existingTimer = asyncTimers.current.get(name);
      if (existingTimer) clearTimeout(existingTimer);

      for (const fn of syncFns) {
        const error = fn(value, nextValues) as string | undefined;
        if (error) {
          asyncTokens.current[name] = (asyncTokens.current[name] ?? 0) + 1;
          setIsValidating((prev) => ({ ...prev, [name]: false }));
          setErrors((prev) => ({ ...prev, [name]: error }));
          return;
        }
      }

      if (!asyncFn) {
        asyncTokens.current[name] = (asyncTokens.current[name] ?? 0) + 1;
        setIsValidating((prev) => ({ ...prev, [name]: false }));
        setErrors((prev) => ({ ...prev, [name]: undefined }));
        return;
      }

      setErrors((prev) => ({ ...prev, [name]: undefined }));
      setIsValidating((prev) => ({ ...prev, [name]: true }));
      const token = (asyncTokens.current[name] ?? 0) + 1;
      asyncTokens.current[name] = token;

      const timer = setTimeout(() => {
        Promise.resolve(asyncFn(value, nextValues)).then((asyncError) => {
          if (asyncTokens.current[name] !== token) return;
          setIsValidating((prev) => ({ ...prev, [name]: false }));
          setErrors((prev) => ({ ...prev, [name]: asyncError }));
        });
      }, ASYNC_VALIDATION_DEBOUNCE_MS);
      asyncTimers.current.set(name, timer);
    },
    [validators]
  );

  const validateAll = useCallback(
    async (nextValues: T) => {
      const nextErrors: Partial<Record<keyof T, string>> = {};
      for (const key of Object.keys(nextValues) as (keyof T)[]) {
        const error = await runValidatorsAsync(nextValues[key], nextValues, validators?.[key]);
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
        validateField(name, nextValue, nextValues);
      }
    },
    [values, touched, validateField]
  );

  const handleBlur = useCallback(
    (e: FocusEvent<FieldElement>) => {
      const name = e.target.name as keyof T;
      setTouched((prev) => ({ ...prev, [name]: true }));
      validateField(name, values[name], values);
    },
    [values, validateField]
  );

  const setFieldValue = useCallback((name: keyof T, value: T[keyof T]) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const setFieldError = useCallback((name: keyof T, error: string | undefined) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, []);

  const resetForm = useCallback(() => {
    asyncTimers.current.forEach((timer) => clearTimeout(timer));
    asyncTimers.current.clear();
    asyncTokens.current = {};
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsValidating({});
  }, [initialValues]);

  const handleSubmit = useCallback(
    (e?: FormEvent<HTMLFormElement>) => {
      e?.preventDefault();
      setIsSubmitting(true);
      validateAll(values).then((nextErrors) => {
        setErrors(nextErrors);
        setTouched(
          Object.keys(values).reduce(
            (acc, key) => ({ ...acc, [key]: true }),
            {} as Partial<Record<keyof T, boolean>>
          )
        );
        if (Object.keys(nextErrors).length > 0) {
          setIsSubmitting(false);
          return;
        }
        Promise.resolve(onSubmit(values)).finally(() => setIsSubmitting(false));
      });
    },
    [onSubmit, validateAll, values]
  );

  // Reflects the currently-known error state rather than re-running every validator on
  // each render — with async validators, whether a field passes can't be known synchronously
  // until its check resolves, so `isValid` tracks `errors` (and any check still in flight).
  const isValid = useMemo(
    () => Object.values(errors).every((error) => !error) && Object.values(isValidating).every((v) => !v),
    [errors, isValidating]
  );

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValidating,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    resetForm,
  };
}
