import type { ChartTheme } from "../theme.js";
import { getCategoricalColors, getChrome } from "../theme.js";
import "./RadialProgress.css";

export interface RadialProgressProps {
  /** 0–100. */
  value: number;
  label?: string;
  /** Defaults to the theme's second categorical color. */
  color?: string;
  theme?: ChartTheme;
  size?: number;
  strokeWidth?: number;
}

export function RadialProgress({
  value,
  label,
  color,
  theme = "light",
  size = 140,
  strokeWidth = 14,
}: RadialProgressProps) {
  const chrome = getChrome(theme);
  const palette = getCategoricalColors(theme);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, value));
  const offset = circumference * (1 - clamped / 100);
  const cx = size / 2;
  const cy = size / 2;
  const strokeColor = color ?? palette[1 % palette.length];

  return (
    <div className="wmx-chart" style={{ width: size, background: chrome.surface }}>
      <svg
        width={size}
        height={size}
        role="img"
        aria-label={`${Math.round(clamped)}%${label ? ` ${label}` : ""}`}
      >
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke={chrome.grid} strokeWidth={strokeWidth} />
        <circle
          className="wmx-radial-progress__bar"
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        <text
          x={cx}
          y={label ? cy - 6 : cy}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={24}
          fontWeight={700}
          fill={chrome.primary}
        >
          {Math.round(clamped)}%
        </text>
        {label && (
          <text x={cx} y={cy + 18} textAnchor="middle" fontSize={11} fill={chrome.muted}>
            {label}
          </text>
        )}
      </svg>
    </div>
  );
}
