import { useState } from "react";
import type { ChartTheme } from "../theme.js";
import { getCategoricalColors, getChrome } from "../theme.js";
import { niceScale, formatTick } from "../scale.js";
import { roundedTopRectPath } from "../paths.js";
import { getRelativePoint } from "../dom.js";
import { ChartLegend } from "../Legend.js";
import { ChartTooltip, type TooltipState } from "../Tooltip.js";
import "./BarChart.css";

export interface BarChartDatum {
  label: string;
  values: number[];
}

export interface BarChartProps {
  data: BarChartDatum[];
  series?: string[];
  colors?: string[];
  theme?: ChartTheme;
  width?: number;
  height?: number;
  valueFormatter?: (value: number) => string;
  /** Stacks each group's series cumulatively instead of placing them side by side. */
  stacked?: boolean;
}

const MAX_BAR_THICKNESS = 24;
const MAX_STACKED_THICKNESS = 40;
const BAR_GAP = 2;
const PADDING = { top: 16, right: 16, bottom: 28, left: 44 };

export function BarChart({
  data,
  series,
  colors,
  theme = "light",
  width = 480,
  height = 260,
  valueFormatter = formatTick,
  stacked = false,
}: BarChartProps) {
  const chrome = getChrome(theme);
  const palette = colors ?? getCategoricalColors(theme);
  const seriesCount = data[0]?.values.length ?? 0;
  const seriesNames = series ?? Array.from({ length: seriesCount }, (_, i) => `Series ${i + 1}`);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const plotWidth = width - PADDING.left - PADDING.right;
  const plotHeight = height - PADDING.top - PADDING.bottom;

  const rawMax = stacked
    ? Math.max(0, ...data.map((d) => d.values.reduce((sum, v) => sum + v, 0)))
    : Math.max(0, ...data.flatMap((d) => d.values));
  const { max, ticks } = niceScale(rawMax);

  const bandWidth = data.length > 0 ? plotWidth / data.length : plotWidth;
  const yFor = (value: number) => PADDING.top + plotHeight - (value / max) * plotHeight;
  const baselineY = yFor(0);

  const totalGap = BAR_GAP * Math.max(0, seriesCount - 1);
  const rawBarWidth = seriesCount > 0 ? (bandWidth - totalGap) / seriesCount : 0;
  const groupedBarWidth = Math.max(1, Math.min(rawBarWidth, MAX_BAR_THICKNESS));
  const groupContentWidth = groupedBarWidth * seriesCount + totalGap;
  const stackedBarWidth = Math.min(bandWidth * 0.6, MAX_STACKED_THICKNESS);

  return (
    <div className="wmx-chart" style={{ width, background: chrome.surface }}>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={`Bar chart with ${data.length} categories across ${seriesCount} series`}
        onMouseLeave={() => setTooltip(null)}
      >
        {ticks.map((tick) => {
          const y = yFor(tick);
          return (
            <g key={tick}>
              <line x1={PADDING.left} x2={width - PADDING.right} y1={y} y2={y} stroke={chrome.grid} strokeWidth={1} />
              <text x={PADDING.left - 8} y={y} textAnchor="end" dominantBaseline="middle" fontSize={11} fill={chrome.muted}>
                {valueFormatter(tick)}
              </text>
            </g>
          );
        })}
        <line x1={PADDING.left} x2={width - PADDING.right} y1={baselineY} y2={baselineY} stroke={chrome.baseline} strokeWidth={1} />

        {data.map((datum, i) => {
          const groupX = PADDING.left + i * bandWidth;

          if (stacked) {
            const barX = groupX + (bandWidth - stackedBarWidth) / 2;
            let cumulative = 0;

            return (
              <g key={datum.label}>
                {datum.values.map((value, s) => {
                  const y0 = yFor(cumulative);
                  cumulative += value;
                  const y1 = yFor(cumulative);
                  const isTop = s === datum.values.length - 1;
                  const color = palette[s % palette.length];

                  return (
                    <path
                      key={s}
                      d={roundedTopRectPath(barX, y1, stackedBarWidth, y0 - y1, isTop ? 4 : 0)}
                      fill={color}
                      onMouseMove={(e) => {
                        const point = getRelativePoint(e);
                        setTooltip({
                          x: point.x,
                          y: point.y,
                          content: `${datum.label} · ${seriesNames[s]}: ${valueFormatter(value)}`,
                        });
                      }}
                    />
                  );
                })}
                <text
                  x={groupX + bandWidth / 2}
                  y={height - PADDING.bottom + 16}
                  textAnchor="middle"
                  fontSize={11}
                  fill={chrome.muted}
                >
                  {datum.label}
                </text>
              </g>
            );
          }

          const startX = groupX + (bandWidth - groupContentWidth) / 2;

          return (
            <g key={datum.label}>
              {datum.values.map((value, s) => {
                const barX = startX + s * (groupedBarWidth + BAR_GAP);
                const barY = yFor(value);
                const barHeight = baselineY - barY;
                const color = palette[s % palette.length];

                return (
                  <path
                    key={s}
                    d={roundedTopRectPath(barX, barY, groupedBarWidth, barHeight, 4)}
                    fill={color}
                    onMouseMove={(e) => {
                      const point = getRelativePoint(e);
                      setTooltip({
                        x: point.x,
                        y: point.y,
                        content: `${datum.label} · ${seriesNames[s]}: ${valueFormatter(value)}`,
                      });
                    }}
                  />
                );
              })}
              <text
                x={groupX + bandWidth / 2}
                y={height - PADDING.bottom + 16}
                textAnchor="middle"
                fontSize={11}
                fill={chrome.muted}
              >
                {datum.label}
              </text>
            </g>
          );
        })}
      </svg>
      <ChartLegend
        items={seriesNames.map((name, i) => ({ label: name, color: palette[i % palette.length] }))}
        theme={theme}
      />
      <ChartTooltip tooltip={tooltip} />
    </div>
  );
}
