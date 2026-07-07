export interface StorageOptions {
  prefix?: string;
}

export interface SetOptions {
  /** Time-to-live in milliseconds. The entry is dropped once it expires. */
  ttl?: number;
}

export interface WmxStorage {
  get<T>(key: string, fallback?: T): T | undefined;
  set<T>(key: string, value: T, options?: SetOptions): void;
  remove(key: string): void;
  has(key: string): boolean;
  clear(): void;
  keys(): string[];
}

interface StoredEntry<T> {
  value: T;
  expiresAt?: number;
}

export function createStorage(area: "local" | "session", options: StorageOptions = {}): WmxStorage {
  const prefix = options.prefix ?? "";

  function resolve(): Storage {
    return area === "local" ? window.localStorage : window.sessionStorage;
  }

  function namespacedKey(key: string): string {
    return prefix ? `${prefix}:${key}` : key;
  }

  function readEntry<T>(key: string): StoredEntry<T> | undefined {
    const raw = resolve().getItem(namespacedKey(key));
    if (raw === null) return undefined;

    const entry = JSON.parse(raw) as StoredEntry<T>;
    if (entry.expiresAt !== undefined && Date.now() > entry.expiresAt) {
      resolve().removeItem(namespacedKey(key));
      return undefined;
    }
    return entry;
  }

  function get<T>(key: string, fallback?: T): T | undefined {
    try {
      const entry = readEntry<T>(key);
      return entry ? entry.value : fallback;
    } catch {
      return fallback;
    }
  }

  function set<T>(key: string, value: T, options: SetOptions = {}): void {
    const entry: StoredEntry<T> = {
      value,
      expiresAt: options.ttl ? Date.now() + options.ttl : undefined,
    };
    try {
      resolve().setItem(namespacedKey(key), JSON.stringify(entry));
    } catch {
      // quota exceeded or storage disabled — value simply isn't persisted
    }
  }

  function remove(key: string): void {
    try {
      resolve().removeItem(namespacedKey(key));
    } catch {
      // storage disabled
    }
  }

  function has(key: string): boolean {
    try {
      return readEntry(key) !== undefined;
    } catch {
      return false;
    }
  }

  function keys(): string[] {
    try {
      const store = resolve();
      const result: string[] = [];
      for (let i = 0; i < store.length; i++) {
        const fullKey = store.key(i);
        if (fullKey === null) continue;
        if (!prefix) {
          result.push(fullKey);
        } else if (fullKey.startsWith(`${prefix}:`)) {
          result.push(fullKey.slice(prefix.length + 1));
        }
      }
      return result;
    } catch {
      return [];
    }
  }

  function clear(): void {
    try {
      if (!prefix) {
        resolve().clear();
        return;
      }
      keys().forEach((key) => resolve().removeItem(namespacedKey(key)));
    } catch {
      // storage disabled
    }
  }

  return { get, set, remove, has, clear, keys };
}

export const localStore = createStorage("local");
export const sessionStore = createStorage("session");
