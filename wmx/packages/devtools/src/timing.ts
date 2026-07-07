const activeTimers = new Map<string, number>();

/** Starts a named timer. Pair with timeEnd(label) to read the elapsed milliseconds. */
export function time(label: string): void {
  activeTimers.set(label, Date.now());
}

/** Stops a named timer and returns the elapsed milliseconds (0 if it was never started). */
export function timeEnd(label: string): number {
  const start = activeTimers.get(label);
  if (start === undefined) return 0;
  activeTimers.delete(label);
  return Date.now() - start;
}

export interface Measurement<T> {
  result: T;
  duration: number;
}

/** Runs a synchronous function once and reports how long it took. */
export function measure<T>(fn: () => T): Measurement<T> {
  const start = Date.now();
  const result = fn();
  return { result, duration: Date.now() - start };
}

export interface BenchmarkResult {
  iterations: number;
  totalMs: number;
  avgMs: number;
  opsPerSec: number;
}

/** Runs a synchronous function repeatedly and reports throughput. */
export function benchmark(fn: () => void, iterations = 1000): BenchmarkResult {
  const start = Date.now();
  for (let i = 0; i < iterations; i++) fn();
  const totalMs = Date.now() - start;
  const avgMs = totalMs / iterations;

  return {
    iterations,
    totalMs,
    avgMs,
    opsPerSec: avgMs > 0 ? Math.round(1000 / avgMs) : Infinity,
  };
}
