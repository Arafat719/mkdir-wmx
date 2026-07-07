import type { ChartTheme } from "./theme.js";
import { getChrome } from "./theme.js";
import "./Legend.css";

export interface LegendItem {
  label: string;
  color: string;
}

export interface LegendProps {
  items: LegendItem[];
  theme?: ChartTheme;
}

/** Identity must never rely on color alone — shown for every chart with 2+ series, omitted for 1. */
export function ChartLegend({ items, theme = "light" }: LegendProps) {
  if (items.length < 2) return null;
  const chrome = getChrome(theme);

  return (
    <div className="wmx-chart-legend">
      {items.map((item) => (
        <div key={item.label} className="wmx-chart-legend-item">
          <span className="wmx-chart-legend-swatch" style={{ background: item.color }} />
          <span className="wmx-chart-legend-label" style={{ color: chrome.secondary }}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
