import { warnOnce } from "./warnOnce.js";

/** Wraps a function so its first call (per wrapped instance) logs a deprecation warning. */
export function deprecate<T extends (...args: never[]) => unknown>(fn: T, message: string): T {
  const key = `deprecate:${fn.name || "anonymous"}:${message}`;

  return ((...args: Parameters<T>) => {
    warnOnce(key, message);
    return fn(...args);
  }) as T;
}
