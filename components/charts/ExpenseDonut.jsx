"use client";

import { formatRp } from "../../lib/formatters";

const COLORS = [
  "#ef4444", // rose
  "#f59e0b", // amber
  "#3b82f6", // blue
  "#10b981", // emerald
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#14b8a6", // teal
  "#64748b", // slate
];

export default function ExpenseDonut({ categoryData = {} }) {
  const entries = Object.entries(categoryData).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, val]) => sum + val, 0);

  if (entries.length === 0 || total === 0) {
    return (
      <div className="donut-empty-state">
        <p>Belum ada pengeluaran yang tercatat pada periode ini.</p>
      </div>
    );
  }

  // Hitung stroke dasharray untuk SVG Donut
  const radius = 38;
  const circumference = 2 * Math.PI * radius;

  const { items: slices } = entries.reduce(
    (acc, [cat, val], idx) => {
      const percent = (val / total) * 100;
      const strokeDashoffset = circumference - (acc.accumulated / 100) * circumference;
      const strokeDasharray = `${(percent / 100) * circumference} ${circumference}`;

      acc.items.push({
        category: cat,
        value: val,
        percent: Math.round(percent),
        color: COLORS[idx % COLORS.length],
        strokeDasharray,
        strokeDashoffset,
      });

      acc.accumulated += percent;
      return acc;
    },
    { items: [], accumulated: 0 }
  );

  return (
    <div className="expense-donut-container">
      <div className="expense-donut-widget">
        <div className="donut-chart-wrapper">
          <svg className="donut-svg" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="var(--line)"
              strokeWidth="12"
            />
            {slices.map((s, idx) => (
              <circle
                key={idx}
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke={s.color}
                strokeWidth="12"
                strokeDasharray={s.strokeDasharray}
                strokeDashoffset={s.strokeDashoffset}
                transform="rotate(-90 50 50)"
                className="donut-segment"
              />
            ))}
          </svg>
          <div className="donut-center-text">
            <span className="donut-center-sub">Total</span>
            <span className="donut-center-val">{formatRp(total)}</span>
          </div>
        </div>

        <div className="donut-legend-list">
          {slices.slice(0, 5).map((s, idx) => (
            <div key={idx} className="donut-legend-row">
              <div className="donut-legend-left">
                <span className="donut-color-dot" style={{ backgroundColor: s.color }} />
                <span className="donut-cat-name">{s.category}</span>
              </div>
              <div className="donut-legend-right">
                <span className="donut-val">{formatRp(s.value)}</span>
                <span className="donut-pct">{s.percent}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {slices.length > 0 && (
        <div className="donut-insights-wrap">
          <div className="donut-insight-bar">
            <div className="donut-insight-label">
              <span>Alokasi Biaya Terbesar:</span>
              <strong>{slices[0]?.category} ({slices[0]?.percent}%)</strong>
            </div>
            <div className="donut-progress-track">
              {slices.map((s, idx) => (
                <div
                  key={idx}
                  className="donut-progress-segment"
                  style={{ width: `${s.percent}%`, backgroundColor: s.color }}
                  title={`${s.category}: ${s.percent}%`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
