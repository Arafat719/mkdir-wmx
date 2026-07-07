/** Depth-limited, circular-reference-safe pretty printer — for logging values you can't just JSON.stringify. */
export function inspect(value: unknown, maxDepth = 2): string {
  const seen = new WeakSet<object>();

  function format(val: unknown, depth: number): string {
    if (val === null) return "null";
    if (val === undefined) return "undefined";

    const type = typeof val;
    if (type === "string") return JSON.stringify(val);
    if (type === "number" || type === "boolean" || type === "bigint") return String(val);
    if (type === "function") {
      const fn = val as (...args: unknown[]) => unknown;
      return `[Function: ${fn.name || "anonymous"}]`;
    }
    if (type === "symbol") return String(val);

    const obj = val as object;

    if (seen.has(obj)) return "[Circular]";
    if (depth > maxDepth) return Array.isArray(obj) ? "[Array]" : "[Object]";

    seen.add(obj);
    try {
      if (Array.isArray(obj)) {
        return `[${obj.map((item) => format(item, depth + 1)).join(", ")}]`;
      }
      if (obj instanceof Date) return obj.toISOString();
      if (obj instanceof Map) {
        const parts = Array.from(obj.entries()).map(
          ([k, v]) => `${format(k, depth + 1)} => ${format(v, depth + 1)}`
        );
        return `Map(${obj.size}) { ${parts.join(", ")} }`;
      }
      if (obj instanceof Set) {
        const parts = Array.from(obj.values()).map((v) => format(v, depth + 1));
        return `Set(${obj.size}) { ${parts.join(", ")} }`;
      }

      const entries = Object.entries(obj as Record<string, unknown>).map(
        ([key, entryValue]) => `${key}: ${format(entryValue, depth + 1)}`
      );
      const ctorName = (obj as { constructor?: { name?: string } }).constructor?.name;
      const prefix = ctorName && ctorName !== "Object" ? `${ctorName} ` : "";
      return `${prefix}{ ${entries.join(", ")} }`;
    } finally {
      seen.delete(obj);
    }
  }

  return format(value, 0);
}
