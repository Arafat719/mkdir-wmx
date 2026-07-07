export interface Logger {
  debug(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
}

export interface LoggerOptions {
  enabled?: boolean;
}

/** A namespaced console logger — every line is tagged so you can tell which part of the app logged it. */
export function createLogger(namespace: string, options: LoggerOptions = {}): Logger {
  const enabled = options.enabled ?? true;
  const tag = `[${namespace}]`;

  const write = (method: "debug" | "info" | "warn" | "error", args: unknown[]): void => {
    if (!enabled) return;
    console[method](tag, ...args);
  };

  return {
    debug: (...args) => write("debug", args),
    info: (...args) => write("info", args),
    warn: (...args) => write("warn", args),
    error: (...args) => write("error", args),
  };
}
