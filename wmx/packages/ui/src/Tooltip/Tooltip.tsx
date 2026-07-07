import type { ReactElement, ReactNode } from "react";
import "./Tooltip.css";

export type TooltipPosition = "top" | "bottom" | "left" | "right";

export interface TooltipProps {
  content: ReactNode;
  position?: TooltipPosition;
  children: ReactElement;
}

export function Tooltip({ content, position = "top", children }: TooltipProps) {
  return (
    <span className="wmx-tooltip">
      {children}
      <span className={`wmx-tooltip__bubble wmx-tooltip__bubble--${position}`} role="tooltip">
        {content}
      </span>
    </span>
  );
}
