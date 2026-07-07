import { useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import type { ChartTheme } from "../theme.js";
import { getCategoricalColors, getChrome } from "../theme.js";
import { formatTick } from "../scale.js";
import { donutSlicePath } from "../paths.js";
import { getRelativePoint } from "../dom.js";
import { ChartLegend } from "../Legend.js";
import { ChartTooltip, type TooltipState } from "../Tooltip.js";
import "./DonutChart.css";

export interface DonutChartDatum {
  label: string;
  value: number;
}

export interface DonutChartProps {
  data: DonutChartDatum[];
  colors?: string[];
  theme?: ChartTheme;
  /** Overall SVG size (square). */
  size?: number;
  /** 0 renders a pie; > 0 renders a donut. Defaults to a donut. */
  innerRadiusRatio?: number;
  /** Shown in the hole — only meaningful when innerRadiusRatio > 0. */
  centerLabel?: string;
  valueFormatter?: (value: number) => string;
}

export function DonutChart({
  data,
  colors,
  theme = "light",
  size = 240,
  innerRadiusRatio = 0.6,
  centerLabel,
  valueFormatter = formatTick,
}: DonutChartProps) {
  const chrome = getChrome(theme);
  const palette = colors ?? getCategoricalColors(theme);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  const outerRadius = size / 2 - 8;
  const innerRadius = outerRadius * innerRadiusRatio;

  let cursor = 0;
  const slices = data.map((datum, index) => {
    const fraction = total > 0 ? datum.value / total : 0;
    const startAngle = cursor;
    const endAngle = cursor + fraction * Math.PI * 2;
    cursor = endAngle;
    return { ...datum, index, startAngle, endAngle, fraction };
  });

  function handleEnter(e: ReactMouseEvent<SVGPathElement>, slice: (typeof slices)[number]) {
    const point = getRelativePoint(e);
    setHoverIndex(slice.index);
    setTooltip({
      x: point.x,
      y: point.y,
      content: `${slice.label}: ${valueFormatter(slice.value)} (${(slice.fraction * 100).toFixed(1)}%)`,
    });
  }

  function handleMove(e: ReactMouseEvent<SVGPathElement>) {
    const point = getRelativePoint(e);
    setTooltip((prev) => (prev ? { ...prev, x: point.x, y: point.y } : prev));
  }

  function handleLeave() {
    setHoverIndex(null);
    setTooltip(null);
  }

  return (
    <div className="wmx-chart" style={{ width: size, background: chrome.surface }}>
      <svg width={size} height={size} role="img" aria-label={`Donut chart with ${data.length} categories`}>
        {slices.map((slice) => {
          const isHovered = hoverIndex === slice.index;
          const radius = isHovered ? outerRadius + 4 : outerRadius;
          return (
            <path
              key={slice.label}
              d={donutSlicePath(cx, cy, radius, innerRadius, slice.startAngle, slice.endAngle)}
              fill={palette[slice.index % palette.length]}
              stroke={chrome.surface}
              strokeWidth={2}
              strokeLinejoin="round"
              onMouseEnter={(e) => handleEnter(e, slice)}
              onMouseMove={handleMove}
              onMouseLeave={handleLeave}
            />
          );
        })}
        {innerRadiusRatio > 0 && centerLabel && (
          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={16} fontWeight={600} fill={chrome.primary}>
            {centerLabel}
          </text>
        )}
      </svg>
      <ChartLegend
        items={data.map((d, i) => ({ label: d.label, color: palette[i % palette.length] }))}
        theme={theme}
      />
      <ChartTooltip tooltip={tooltip} />
    </div>
  );
}
