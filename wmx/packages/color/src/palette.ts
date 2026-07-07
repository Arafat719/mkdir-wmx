import { hexToHsl, hslToHex } from "./convert.js";

const SHADE_STEPS = {
  "50": 97,
  "100": 94,
  "200": 86,
  "300": 74,
  "400": 60,
  "500": 50,
  "600": 42,
  "700": 34,
  "800": 26,
  "900": 18,
  "950": 10,
} as const;

export type ShadeScale = Record<keyof typeof SHADE_STEPS, string>;

/** Generates a Tailwind-style 50–950 shade scale from a single base color. */
export function generateShades(baseHex: string): ShadeScale {
  const { h, s } = hexToHsl(baseHex);
  const shades = {} as ShadeScale;
  (Object.keys(SHADE_STEPS) as Array<keyof typeof SHADE_STEPS>).forEach((step) => {
    shades[step] = hslToHex(h, s, SHADE_STEPS[step]);
  });
  return shades;
}

export interface ColorHarmony {
  base: string;
  complementary: string;
  analogous: [string, string];
  triadic: [string, string];
}

/** Derives standard color-wheel harmonies (complementary, analogous, triadic) from a base color. */
export function generateHarmony(baseHex: string): ColorHarmony {
  const { h, s, l } = hexToHsl(baseHex);
  const rotate = (deg: number) => hslToHex((((h + deg) % 360) + 360) % 360, s, l);
  return {
    base: baseHex,
    complementary: rotate(180),
    analogous: [rotate(-30), rotate(30)],
    triadic: [rotate(120), rotate(240)],
  };
}
