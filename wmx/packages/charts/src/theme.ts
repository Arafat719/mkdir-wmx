export type ChartTheme = "light" | "dark";

/**
 * Validated categorical palette (see the wmx dataviz guidelines) — fixed hue
 * order, never cycled. Passes lightness-band, chroma-floor, and CVD-separation
 * checks; the light-mode aqua/yellow/magenta slots sit below 3:1 contrast, so
 * consumers must keep the legend and direct labels this package ships by
 * default rather than relying on color alone.
 */
export const CATEGORICAL_LIGHT = [
  "#2a78d6",
  "#1baf7a",
  "#eda100",
  "#008300",
  "#4a3aa7",
  "#e34948",
  "#e87ba4",
  "#eb6834",
] as const;

export const CATEGORICAL_DARK = [
  "#3987e5",
  "#199e70",
  "#c98500",
  "#008300",
  "#9085e9",
  "#e66767",
  "#d55181",
  "#d95926",
] as const;

export interface ChartChrome {
  surface: string;
  primary: string;
  secondary: string;
  muted: string;
  grid: string;
  baseline: string;
}

const CHROME: Record<ChartTheme, ChartChrome> = {
  light: {
    surface: "#fcfcfb",
    primary: "#0b0b0b",
    secondary: "#52514e",
    muted: "#898781",
    grid: "#e1e0d9",
    baseline: "#c3c2b7",
  },
  dark: {
    surface: "#1a1a19",
    primary: "#ffffff",
    secondary: "#c3c2b7",
    muted: "#898781",
    grid: "#2c2c2a",
    baseline: "#383835",
  },
};

export function getChrome(theme: ChartTheme = "light"): ChartChrome {
  return CHROME[theme];
}

export function getCategoricalColors(theme: ChartTheme = "light"): readonly string[] {
  return theme === "dark" ? CATEGORICAL_DARK : CATEGORICAL_LIGHT;
}
