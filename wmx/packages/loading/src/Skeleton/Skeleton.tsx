import type { CSSProperties, HTMLAttributes } from "react";
import "./Skeleton.css";

export type SkeletonVariant = "text" | "circle" | "rect";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  width?: number | string;
  height?: number | string;
  lines?: number;
}

export function Skeleton({
  variant = "text",
  width,
  height,
  lines = 1,
  className,
  style,
  ...rest
}: SkeletonProps) {
  if (variant === "text" && lines > 1) {
    return (
      <div className={["wmx-skeleton-group", className].filter(Boolean).join(" ")} {...rest}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="wmx-skeleton wmx-skeleton--text"
            style={{ width: i === lines - 1 ? "60%" : width, height }}
          />
        ))}
      </div>
    );
  }

  const classes = ["wmx-skeleton", `wmx-skeleton--${variant}`, className].filter(Boolean).join(" ");
  const skeletonStyle: CSSProperties = { ...style, width, height };

  return <div className={classes} style={skeletonStyle} {...rest} />;
}
