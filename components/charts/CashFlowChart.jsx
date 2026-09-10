"use client";

import { useState } from "react";
import { formatRp } from "../../lib/formatters";

export default function CashFlowChart({ data = [] }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="chart-empty-placeholder">
        <p>Belum ada data transaksi yang cukup untuk menampilkan grafik arus kas.</p>
      </div>
    );
  }

  // Cari nilai maksimum untuk normalisasi tinggi chart
  const maxValue = Math.max(
    100000,
    ...data.map((d) => Math.max(d.income, d.expense))
  );

  return (
    <div className="cashflow-chart-container">
      <div className="chart-legend">
        <div className="legend-item">
          <span className="legend-dot dot-income" />
          <span>Pemasukan</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot dot-expense" />
          <span>Pengeluaran</span>
        </div>
      </div>

      <div className="chart-svg-wrapper">
        <div className="chart-bars-area">
          {data.map((item, idx) => {
            const incomePct = Math.min(100, Math.max(3, (item.income / maxValue) * 100));
            const expensePct = Math.min(100, Math.max(3, (item.expense / maxValue) * 100));
            const isHovered = hoveredIndex === idx;

            return (
              <div
                key={item.yearMonth}
                className={`chart-bar-group ${isHovered ? "is-hovered" : ""}`}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => setHoveredIndex(hoveredIndex === idx ? null : idx)}
              >
                {/* Tooltip */}
                {isHovered && (
                  <div className="chart-tooltip">
                    <div className="tooltip-title">{item.monthName} ({item.yearMonth})</div>
                    <div className="tooltip-row text-emerald">
                      <span>Masuk:</span> <strong>{formatRp(item.income)}</strong>
                    </div>
                    <div className="tooltip-row text-rose">
                      <span>Keluar:</span> <strong>{formatRp(item.expense)}</strong>
                    </div>
                    <div className="tooltip-row text-muted">
                      <span>Net:</span> <strong>{formatRp(item.net)}</strong>
                    </div>
                  </div>
                )}

                {/* Bars */}
                <div className="bar-track">
                  <div
                    className="bar-fill bar-income"
                    style={{ height: `${incomePct}%` }}
                    title={`Pemasukan: ${formatRp(item.income)}`}
                  />
                  <div
                    className="bar-fill bar-expense"
                    style={{ height: `${expensePct}%` }}
                    title={`Pengeluaran: ${formatRp(item.expense)}`}
                  />
                </div>

                <div className="bar-label">{item.monthName}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
