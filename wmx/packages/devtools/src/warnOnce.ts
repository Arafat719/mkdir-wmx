const warned = new Set<string>();

/** Logs a console warning the first time a given key is seen, and silently no-ops after that. */
export function warnOnce(key: string, message: string): void {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(message);
}
