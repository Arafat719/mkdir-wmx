/** A rect with the top two corners rounded and a square baseline edge — the bar/column mark spec. */
export function roundedTopRectPath(x: number, y: number, width: number, height: number, radius: number): string {
  if (height <= 0 || width <= 0) return "";
  const r = Math.min(radius, width / 2, height);

  return [
    `M${x},${y + height}`,
    `L${x},${y + r}`,
    `Q${x},${y} ${x + r},${y}`,
    `L${x + width - r},${y}`,
    `Q${x + width},${y} ${x + width},${y + r}`,
    `L${x + width},${y + height}`,
    "Z",
  ].join(" ");
}

export interface Point {
  x: number;
  y: number;
}

/** An SVG donut/pie slice path between two angles (radians, 0 = up, clockwise). */
export function donutSlicePath(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number
): string {
  const point = (angle: number, radius: number): Point => ({
    x: cx + radius * Math.sin(angle),
    y: cy - radius * Math.cos(angle),
  });

  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  const outerStart = point(startAngle, outerRadius);
  const outerEnd = point(endAngle, outerRadius);

  if (innerRadius <= 0) {
    return [
      `M${cx},${cy}`,
      `L${outerStart.x},${outerStart.y}`,
      `A${outerRadius},${outerRadius} 0 ${largeArc} 1 ${outerEnd.x},${outerEnd.y}`,
      "Z",
    ].join(" ");
  }

  const innerStart = point(startAngle, innerRadius);
  const innerEnd = point(endAngle, innerRadius);

  return [
    `M${outerStart.x},${outerStart.y}`,
    `A${outerRadius},${outerRadius} 0 ${largeArc} 1 ${outerEnd.x},${outerEnd.y}`,
    `L${innerEnd.x},${innerEnd.y}`,
    `A${innerRadius},${innerRadius} 0 ${largeArc} 0 ${innerStart.x},${innerStart.y}`,
    "Z",
  ].join(" ");
}
