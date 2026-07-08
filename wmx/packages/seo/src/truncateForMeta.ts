/** Truncates at the last word boundary before maxLength, so meta descriptions never cut mid-word. */
export function truncateForMeta(text: string, maxLength = 160): string {
  if (text.length <= maxLength) return text;
  const sliced = text.slice(0, maxLength - 1);
  // If the very next character in the source text is whitespace, the slice already
  // ends on a complete word — trimming back further would drop a whole word for no reason.
  if (/\s/.test(text[maxLength - 1] ?? "")) {
    return `${sliced.trimEnd()}…`;
  }
  const lastSpace = sliced.lastIndexOf(" ");
  return `${sliced.slice(0, lastSpace > 0 ? lastSpace : sliced.length)}…`;
}
