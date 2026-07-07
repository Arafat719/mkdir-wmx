import type { ReactNode } from "react";
import "./Tooltip.css";

export interface TooltipState {
  x: number;
  y: number;
  content: ReactNode;
}

export interface ChartTooltipProps {
  tooltip: TooltipState | null;
}

export function ChartTooltip({ tooltip }: ChartTooltipProps) {
  if (!tooltip) return null;

  return (
    <div className="wmx-chart-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
      {tooltip.content}
    </div>
  );
}
