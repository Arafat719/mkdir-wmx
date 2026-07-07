export function buildCanonicalUrl(baseUrl: string, path = ""): string {
  const trimmedBase = baseUrl.replace(/\/+$/, "");
  const normalizedPath = path ? `/${path.replace(/^\/+/, "")}` : "";
  return `${trimmedBase}${normalizedPath}`;
}
