function base64UrlToString(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Decodes a JWT's payload without verifying its signature. */
export function decodeToken<T = Record<string, unknown>>(token: string): T | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(base64UrlToString(parts[1])) as T;
  } catch {
    return null;
  }
}

/** Returns the token's `exp` claim as a millisecond epoch timestamp, or null if absent/unparseable. */
export function getTokenExpiry(token: string): number | null {
  const payload = decodeToken<{ exp?: number }>(token);
  if (!payload || typeof payload.exp !== "number") return null;
  return payload.exp * 1000;
}

/** A token with no `exp` claim, or one that fails to decode, is treated as expired. */
export function isTokenExpired(token: string, leewaySeconds = 0): boolean {
  const expiry = getTokenExpiry(token);
  if (expiry === null) return true;
  return Date.now() >= expiry - leewaySeconds * 1000;
}
