export function throttle<T extends (...args: any[]) => void>(
  fn: T,
  limit = 300
): (...args: Parameters<T>) => void {
  let waiting = false;

  return (...args: Parameters<T>) => {
    if (waiting) return;
    fn(...args);
    waiting = true;
    setTimeout(() => {
      waiting = false;
    }, limit);
  };
}
