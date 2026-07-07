import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import "./Stack.css";

export type StackDirection = "row" | "column";
export type StackAlign = "start" | "center" | "end" | "stretch";
export type StackJustify = "start" | "center" | "end" | "between" | "around";

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  direction?: StackDirection;
  gap?: number | string;
  align?: StackAlign;
  justify?: StackJustify;
  wrap?: boolean;
  children: ReactNode;
}

export function Stack({
  direction = "column",
  gap,
  align = "stretch",
  justify = "start",
  wrap = false,
  className,
  style,
  children,
  ...rest
}: StackProps) {
  const classes = [
    "wmx-stack",
    `wmx-stack--${direction}`,
    `wmx-stack--align-${align}`,
    `wmx-stack--justify-${justify}`,
    wrap && "wmx-stack--wrap",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const stackStyle: CSSProperties = gap !== undefined ? { ...style, gap: typeof gap === "number" ? `${gap}px` : gap } : style ?? {};

  return (
    <div className={classes} style={stackStyle} {...rest}>
      {children}
    </div>
  );
}
