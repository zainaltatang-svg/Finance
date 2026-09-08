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

  const chartHeight = 180;

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
            const incomeHeight = Math.max(4, (item.income / maxValue) * chartHeight);
            const expenseHeight = Math.max(4, (item.expense / maxValue) * chartHeight);
            const isHovered = hoveredIndex === idx;

            return (
              <div
                key={item.yearMonth}
                className={`chart-bar-group ${isHovered ? "is-hovered" : ""}`}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
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
                <div className="bar-track" style={{ height: `${chartHeight}px` }}>
                  <div
                    className="bar-fill bar-income"
                    style={{ height: `${incomeHeight}px` }}
                    title={`Pemasukan: ${formatRp(item.income)}`}
                  />
                  <div
                    className="bar-fill bar-expense"
                    style={{ height: `${expenseHeight}px` }}
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
