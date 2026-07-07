import type { HTMLAttributes, ReactNode } from "react";
import "./Container.css";

export type ContainerSize = "sm" | "md" | "lg" | "xl" | "full";

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: ContainerSize;
  children: ReactNode;
}

export function Container({ size = "lg", className, children, ...rest }: ContainerProps) {
  const classes = ["wmx-container", `wmx-container--${size}`, className].filter(Boolean).join(" ");

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}
