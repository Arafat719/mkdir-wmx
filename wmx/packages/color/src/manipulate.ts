import { hexToHsl, hexToRgb, hslToHex, rgbToHex } from "./convert.js";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function lighten(hex: string, amount = 10): string {
  const { h, s, l } = hexToHsl(hex);
  return hslToHex(h, s, clamp(l + amount, 0, 100));
}

export function darken(hex: string, amount = 10): string {
  const { h, s, l } = hexToHsl(hex);
  return hslToHex(h, s, clamp(l - amount, 0, 100));
}

export function mix(hexA: string, hexB: string, weight = 0.5): string {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const w = clamp(weight, 0, 1);
  return rgbToHex(
    a.r + (b.r - a.r) * w,
    a.g + (b.g - a.g) * w,
    a.b + (b.b - a.b) * w
  );
}

/** Returns an `rgba(r, g, b, alpha)` string for the given hex color. */
export function withAlpha(hex: string, alpha = 1): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${clamp(alpha, 0, 1)})`;
}
