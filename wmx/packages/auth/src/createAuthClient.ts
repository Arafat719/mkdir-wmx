import { getTokenExpiry } from "./jwt.js";

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
}

export type AuthStorageArea = "local" | "session" | "memory";

export interface AuthClientOptions {
  storage?: AuthStorageArea;
  storageKey?: string;
  /** Seconds before expiry to trigger onRefresh. Only applies when the access token is a JWT with an `exp` claim. */
  refreshLeewaySeconds?: number;
  onRefresh?: (refreshToken: string) => Promise<AuthTokens> | AuthTokens;
}

export interface AuthClient {
  getState(): AuthState;
  getAccessToken(): string | null;
  isAuthenticated(): boolean;
  login(tokens: AuthTokens): void;
  logout(): void;
  subscribe(listener: (state: AuthState) => void): () => void;
}

const EMPTY_STATE: AuthState = { isAuthenticated: false, accessToken: null, refreshToken: null };

export function createAuthClient(options: AuthClientOptions = {}): AuthClient {
  const { storage = "local", storageKey = "wmx-auth", refreshLeewaySeconds = 30, onRefresh } = options;

  let memoryTokens: AuthTokens | null = null;
  let state: AuthState = EMPTY_STATE;
  let refreshTimer: ReturnType<typeof setTimeout> | undefined;
  const listeners = new Set<(state: AuthState) => void>();

  function backingStorage(): Storage | null {
    if (storage === "memory") return null;
    try {
      return storage === "local" ? window.localStorage : window.sessionStorage;
    } catch {
      return null;
    }
  }

  function persist(tokens: AuthTokens | null): void {
    const store = backingStorage();
    if (!store) {
      memoryTokens = tokens;
      return;
    }
    try {
      if (tokens) store.setItem(storageKey, JSON.stringify(tokens));
      else store.removeItem(storageKey);
    } catch {
      memoryTokens = tokens;
    }
  }

  function readPersisted(): AuthTokens | null {
    const store = backingStorage();
    if (!store) return memoryTokens;
    try {
      const raw = store.getItem(storageKey);
      return raw ? (JSON.parse(raw) as AuthTokens) : null;
    } catch {
      return null;
    }
  }

  function notify(): void {
    listeners.forEach((listener) => listener(state));
  }

  function clearRefreshTimer(): void {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
      refreshTimer = undefined;
    }
  }

  function scheduleRefresh(tokens: AuthTokens): void {
    clearRefreshTimer();
    if (!onRefresh || !tokens.refreshToken) return;

    const expiry = getTokenExpiry(tokens.accessToken);
    if (expiry === null) return;

    const delay = Math.max(0, expiry - Date.now() - refreshLeewaySeconds * 1000);
    refreshTimer = setTimeout(() => {
      Promise.resolve(onRefresh(tokens.refreshToken as string))
        .then(login)
        .catch(logout);
    }, delay);
  }

  function login(tokens: AuthTokens): void {
    persist(tokens);
    state = { isAuthenticated: true, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken ?? null };
    notify();
    scheduleRefresh(tokens);
  }

  function logout(): void {
    clearRefreshTimer();
    persist(null);
    state = EMPTY_STATE;
    notify();
  }

  function subscribe(listener: (state: AuthState) => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  const persisted = readPersisted();
  if (persisted) {
    state = { isAuthenticated: true, accessToken: persisted.accessToken, refreshToken: persisted.refreshToken ?? null };
    scheduleRefresh(persisted);
  }

  return {
    getState: () => state,
    getAccessToken: () => state.accessToken,
    isAuthenticated: () => state.isAuthenticated,
    login,
    logout,
    subscribe,
  };
}
