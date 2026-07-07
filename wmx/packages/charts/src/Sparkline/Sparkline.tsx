import type { ChartTheme } from "../theme.js";
import { getChrome } from "../theme.js";
import "./Sparkline.css";

export interface SparklineProps {
  data: number[];
  color?: string;
  theme?: ChartTheme;
  width?: number;
  height?: number;
  showArea?: boolean;
}

/** A tiny inline trend line — no axes, legend, or tooltip, matching the stat-tile trend mark. */
export function Sparkline({ data, color, theme = "light", width = 96, height = 24, showArea = false }: SparklineProps) {
  const chrome = getChrome(theme);
  const stroke = color ?? (theme === "dark" ? "#3987e5" : "#2a78d6");

  if (data.length === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;

  const xFor = (i: number) => (data.length > 1 ? (i / (data.length - 1)) * (width - padding * 2) + padding : width / 2);
  const yFor = (value: number) => height - padding - ((value - min) / range) * (height - padding * 2);

  const linePath = data.map((value, i) => `${i === 0 ? "M" : "L"}${xFor(i)},${yFor(value)}`).join(" ");
  const areaPath = `${linePath} L${xFor(data.length - 1)},${height} L${xFor(0)},${height} Z`;

  return (
    <svg
      className="wmx-sparkline"
      width={width}
      height={height}
      role="img"
      aria-label={`Trend sparkline, ${data.length} points, from ${min} to ${max}`}
    >
      {showArea && <path d={areaPath} fill={stroke} opacity={0.1} stroke="none" />}
      <path d={linePath} fill="none" stroke={stroke} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={xFor(data.length - 1)} cy={yFor(data[data.length - 1])} r={2.5} fill={stroke} stroke={chrome.surface} strokeWidth={1.5} />
    </svg>
  );
}
