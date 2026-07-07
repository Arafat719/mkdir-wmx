import { useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import type { ChartTheme } from "../theme.js";
import { getCategoricalColors, getChrome } from "../theme.js";
import { niceScale, formatTick } from "../scale.js";
import { getRelativePoint } from "../dom.js";
import { ChartLegend } from "../Legend.js";
import { ChartTooltip, type TooltipState } from "../Tooltip.js";
import "./LineChart.css";

export interface LineChartDatum {
  label: string;
  values: number[];
}

export interface LineChartProps {
  data: LineChartDatum[];
  series?: string[];
  colors?: string[];
  theme?: ChartTheme;
  width?: number;
  height?: number;
  valueFormatter?: (value: number) => string;
}

const PADDING = { top: 16, right: 48, bottom: 28, left: 44 };

export function LineChart({
  data,
  series,
  colors,
  theme = "light",
  width = 480,
  height = 260,
  valueFormatter = formatTick,
}: LineChartProps) {
  const chrome = getChrome(theme);
  const palette = colors ?? getCategoricalColors(theme);
  const seriesCount = data[0]?.values.length ?? 0;
  const seriesNames = series ?? Array.from({ length: seriesCount }, (_, i) => `Series ${i + 1}`);
  const seriesIndexes = Array.from({ length: seriesCount }, (_, i) => i);

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const plotWidth = width - PADDING.left - PADDING.right;
  const plotHeight = height - PADDING.top - PADDING.bottom;

  const rawMax = Math.max(0, ...data.flatMap((d) => d.values));
  const { max, ticks } = niceScale(rawMax);

  const xFor = (i: number) => (data.length > 1 ? PADDING.left + (i / (data.length - 1)) * plotWidth : PADDING.left + plotWidth / 2);
  const yFor = (value: number) => PADDING.top + plotHeight - (value / max) * plotHeight;

  const linePaths = seriesIndexes.map((s) =>
    data.map((d, i) => `${i === 0 ? "M" : "L"}${xFor(i)},${yFor(d.values[s])}`).join(" ")
  );

  const lastIndex = data.length - 1;

  function handleMove(e: ReactMouseEvent<SVGSVGElement>) {
    if (data.length === 0) return;
    const point = getRelativePoint(e);
    const ratio = data.length > 1 ? (point.x - PADDING.left) / plotWidth : 0;
    const index = Math.max(0, Math.min(lastIndex, Math.round(ratio * (data.length - 1))));
    setHoverIndex(index);

    const parts = seriesNames.map((name, s) => `${name}: ${valueFormatter(data[index].values[s])}`);
    setTooltip({ x: xFor(index), y: yFor(Math.max(...data[index].values)), content: `${data[index].label} — ${parts.join(" · ")}` });
  }

  function handleLeave() {
    setHoverIndex(null);
    setTooltip(null);
  }

  return (
    <div className="wmx-chart" style={{ width, background: chrome.surface }}>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={`Line chart with ${data.length} points across ${seriesCount} series`}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
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

        {hoverIndex !== null && (
          <line
            x1={xFor(hoverIndex)}
            x2={xFor(hoverIndex)}
            y1={PADDING.top}
            y2={height - PADDING.bottom}
            stroke={chrome.baseline}
            strokeWidth={1}
            strokeDasharray="2 2"
          />
        )}

        {linePaths.map((d, s) => (
          <path key={s} d={d} fill="none" stroke={palette[s % palette.length]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        ))}

        {lastIndex >= 0 &&
          seriesIndexes.map((s) => {
            const x = xFor(lastIndex);
            const y = yFor(data[lastIndex].values[s]);
            const color = palette[s % palette.length];
            return (
              <g key={s}>
                <circle cx={x} cy={y} r={4} fill={color} stroke={chrome.surface} strokeWidth={2} />
                <text x={x + 8} y={y} fontSize={11} fill={chrome.secondary} dominantBaseline="middle">
                  {valueFormatter(data[lastIndex].values[s])}
                </text>
              </g>
            );
          })}

        {hoverIndex !== null &&
          seriesIndexes.map((s) => {
            const x = xFor(hoverIndex);
            const y = yFor(data[hoverIndex].values[s]);
            return <circle key={s} cx={x} cy={y} r={4} fill={palette[s % palette.length]} stroke={chrome.surface} strokeWidth={2} />;
          })}

        {data.map((d, i) => (
          <text key={d.label} x={xFor(i)} y={height - PADDING.bottom + 16} textAnchor="middle" fontSize={11} fill={chrome.muted}>
            {d.label}
          </text>
        ))}
      </svg>
      <ChartLegend
        items={seriesNames.map((name, i) => ({ label: name, color: palette[i % palette.length] }))}
        theme={theme}
      />
      <ChartTooltip tooltip={tooltip} />
    </div>
  );
}
