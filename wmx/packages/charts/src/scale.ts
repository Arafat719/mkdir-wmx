export interface NiceScale {
  max: number;
  step: number;
  ticks: number[];
}

/** Rounds an axis max up to a clean number (1/2/5 × 10^n) and generates evenly spaced ticks. */
export function niceScale(rawMax: number, tickCount = 4): NiceScale {
  if (rawMax <= 0) {
    const step = 1 / tickCount;
    return { max: 1, step, ticks: Array.from({ length: tickCount + 1 }, (_, i) => step * i) };
  }

  const roughStep = rawMax / tickCount;
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const residual = roughStep / magnitude;

  let niceResidual: number;
  if (residual > 5) niceResidual = 10;
  else if (residual > 2) niceResidual = 5;
  else if (residual > 1) niceResidual = 2;
  else niceResidual = 1;

  const step = niceResidual * magnitude;
  const max = step * tickCount;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => Math.round(step * i * 1000) / 1000);

  return { max, step, ticks };
}

export function formatTick(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}
