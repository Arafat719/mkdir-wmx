import { hexToRgb, type RGB } from "./convert.js";

function relativeLuminance({ r, g, b }: RGB): number {
  const channel = (c: number): number => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio between two colors, from 1 (no contrast) to 21 (black on white). */
export function getContrastRatio(hexA: string, hexB: string): number {
  const lumA = relativeLuminance(hexToRgb(hexA));
  const lumB = relativeLuminance(hexToRgb(hexB));
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;
}

/** Picks whichever of black/white reads better on top of the given background. */
export function getReadableTextColor(backgroundHex: string): "#000000" | "#ffffff" {
  const contrastWithBlack = getContrastRatio(backgroundHex, "#000000");
  const contrastWithWhite = getContrastRatio(backgroundHex, "#ffffff");
  return contrastWithBlack >= contrastWithWhite ? "#000000" : "#ffffff";
}
