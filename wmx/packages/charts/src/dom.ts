import type { MouseEvent as ReactMouseEvent } from "react";

/** Mouse position relative to the chart's own SVG box, for tooltip/crosshair placement. */
export function getRelativePoint(e: ReactMouseEvent<SVGElement>): { x: number; y: number } {
  const target = e.currentTarget;
  const svg = target instanceof SVGSVGElement ? target : target.ownerSVGElement;
  const rect = (svg ?? target).getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}
