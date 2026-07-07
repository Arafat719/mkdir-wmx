export function unique<T>(items: T[], key?: (item: T) => unknown): T[] {
  if (!key) return Array.from(new Set(items));

  const seen = new Set<unknown>();
  const result: T[] = [];
  for (const item of items) {
    const k = key(item);
    if (seen.has(k)) continue;
    seen.add(k);
    result.push(item);
  }
  return result;
}
