export function createBearerAuthHeader(token: string): string {
  return `Bearer ${token}`;
}

export function createBasicAuthHeader(username: string, password: string): string {
  return `Basic ${btoa(`${username}:${password}`)}`;
}
