import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { useInView } from "../useInView.js";
import "./Reveal.css";

export type RevealDirection = "up" | "down" | "left" | "right" | "fade" | "zoom";

export interface RevealProps extends HTMLAttributes<HTMLDivElement> {
  direction?: RevealDirection;
  delay?: number;
  duration?: number;
  distance?: number;
  once?: boolean;
  threshold?: number;
  children: ReactNode;
}

export function Reveal({
  direction = "up",
  delay = 0,
  duration = 600,
  distance = 24,
  once = true,
  threshold = 0.15,
  className,
  style,
  children,
  ...rest
}: RevealProps) {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold, once });

  const classes = [
    "wmx-reveal",
    `wmx-reveal--${direction}`,
    inView && "wmx-reveal--visible",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const revealStyle: CSSProperties = {
    ...style,
    ["--wmx-reveal-duration" as string]: `${duration}ms`,
    ["--wmx-reveal-delay" as string]: `${delay}ms`,
    ["--wmx-reveal-distance" as string]: `${distance}px`,
  };

  return (
    <div ref={ref} className={classes} style={revealStyle} {...rest}>
      {children}
    </div>
  );
}
