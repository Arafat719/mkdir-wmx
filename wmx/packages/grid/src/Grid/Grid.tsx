import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import "./Grid.css";

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  columns?: number;
  sm?: number;
  md?: number;
  lg?: number;
  gap?: number | string;
  children: ReactNode;
}

export function Grid({ columns = 1, sm, md, lg, gap, className, style, children, ...rest }: GridProps) {
  const classes = [
    "wmx-grid",
    `wmx-grid--cols-${columns}`,
    sm && `wmx-grid--cols-sm-${sm}`,
    md && `wmx-grid--cols-md-${md}`,
    lg && `wmx-grid--cols-lg-${lg}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const gridStyle: CSSProperties = gap !== undefined ? { ...style, gap: typeof gap === "number" ? `${gap}px` : gap } : style ?? {};

  return (
    <div className={classes} style={gridStyle} {...rest}>
      {children}
    </div>
  );
}

export interface GridItemProps extends HTMLAttributes<HTMLDivElement> {
  span?: number;
  smSpan?: number;
  mdSpan?: number;
  lgSpan?: number;
  children?: ReactNode;
}

export function GridItem({ span, smSpan, mdSpan, lgSpan, className, children, ...rest }: GridItemProps) {
  const classes = [
    "wmx-grid__item",
    span && `wmx-grid__item--span-${span}`,
    smSpan && `wmx-grid__item--span-sm-${smSpan}`,
    mdSpan && `wmx-grid__item--span-md-${mdSpan}`,
    lgSpan && `wmx-grid__item--span-lg-${lgSpan}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}
