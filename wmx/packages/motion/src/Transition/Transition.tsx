import { useEffect, useRef, useState } from "react";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import "./Transition.css";

export type TransitionType = "fade" | "scale" | "slide-up" | "slide-down";

export interface TransitionProps extends HTMLAttributes<HTMLDivElement> {
  show: boolean;
  type?: TransitionType;
  duration?: number;
  children: ReactNode;
}

export function Transition({
  show,
  type = "fade",
  duration = 200,
  className,
  style,
  children,
  ...rest
}: TransitionProps) {
  const [mounted, setMounted] = useState(show);
  const [entered, setEntered] = useState(show);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (show) {
      setMounted(true);
      const raf = requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(raf);
    }

    setEntered(false);
    timeoutRef.current = setTimeout(() => setMounted(false), duration);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [show, duration]);

  if (!mounted) return null;

  const classes = [
    "wmx-transition",
    `wmx-transition--${type}`,
    entered && "wmx-transition--entered",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const transitionStyle: CSSProperties = {
    ...style,
    ["--wmx-transition-duration" as string]: `${duration}ms`,
  };

  return (
    <div className={classes} style={transitionStyle} {...rest}>
      {children}
    </div>
  );
}
