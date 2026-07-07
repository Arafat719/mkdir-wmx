import { useEffect, useState } from "react";
import { breakpoints } from "./breakpoints.js";
import type { Breakpoint } from "./breakpoints.js";

function getBreakpoint(): Breakpoint {
  if (typeof window === "undefined") return "base";
  const width = window.innerWidth;
  if (width >= breakpoints.xl) return "xl";
  if (width >= breakpoints.lg) return "lg";
  if (width >= breakpoints.md) return "md";
  if (width >= breakpoints.sm) return "sm";
  return "base";
}

export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>(getBreakpoint);

  useEffect(() => {
    const handleResize = () => setBp(getBreakpoint());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return bp;
}
