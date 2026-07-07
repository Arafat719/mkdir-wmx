export interface Env {
  isBrowser: boolean;
  isNode: boolean;
  isDev: boolean;
}

/** Detects the runtime environment — useful for gating debug-only code paths. */
export function getEnv(): Env {
  const isBrowser = typeof window !== "undefined";
  const isNode = typeof process !== "undefined" && !!process.versions?.node;
  const isDev = isNode ? process.env.NODE_ENV !== "production" : true;

  return { isBrowser, isNode, isDev };
}
