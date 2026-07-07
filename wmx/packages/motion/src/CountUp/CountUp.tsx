import { useEffect, useRef, useState } from "react";
import type { HTMLAttributes } from "react";
import { useInView } from "../useInView.js";

export interface CountUpProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  end: number;
  start?: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  once?: boolean;
}

export function CountUp({
  end,
  start = 0,
  duration = 1200,
  decimals = 0,
  prefix = "",
  suffix = "",
  once = true,
  className,
  ...rest
}: CountUpProps) {
  const [ref, inView] = useInView<HTMLSpanElement>({ threshold: 0.3, once });
  const [value, setValue] = useState(start);
  const frameRef = useRef(0);

  useEffect(() => {
    if (!inView) return;

    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(start + (end - start) * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [inView, start, end, duration]);

  return (
    <span ref={ref} className={["wmx-countup", className].filter(Boolean).join(" ")} {...rest}>
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}
