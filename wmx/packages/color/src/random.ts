import { hslToHex } from "./convert.js";

/** Random color biased toward pleasant, readable tones (avoids muddy/near-black/near-white results). */
export function randomColor(): string {
  const h = Math.floor(Math.random() * 360);
  const s = 60 + Math.floor(Math.random() * 30);
  const l = 45 + Math.floor(Math.random() * 15);
  return hslToHex(h, s, l);
}
