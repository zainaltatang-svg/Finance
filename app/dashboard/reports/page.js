"use client";

import { useState, useMemo } from "react";
import { Printer, Calendar, TrendingUp, TrendingDown, Scale, PieChart } from "lucide-react";
import { useFinance } from "../../../context/FinanceContext";
import { formatRp, todayISO } from "../../../lib/formatters";
import { calculatePnL } from "../../../lib/calculations";

export default function ReportsPage() {
  const {
    transactions,
    orders,
    accountBalances,
    inventoryValuation,
    profile,
  } = useFinance();

  const [periodFilter, setPeriodFilter] = useState("thisMonth"); // 'thisMonth' | 'thisYear' | 'all'

  // Hitung rentang waktu
  const { startDate, endDate, periodLabel } = useMemo(() => {
    const today = todayISO();
    const currentYear = today.slice(0, 4);
    const currentMonth = today.slice(0, 7);

    if (periodFilter === "thisMonth") {
      const [yearNum, monthNum] = currentMonth.split("-").map(Number);
      const lastDay = new Date(yearNum, monthNum, 0).getDate();
      return {
        startDate: `${currentMonth}-01`,
        endDate: `${currentMonth}-${String(lastDay).padStart(2, "0")}`,
        periodLabel: `Bulan Ini (${currentMonth})`,
      };
    }
    if (periodFilter === "thisYear") {
      return {
        startDate: `${currentYear}-01-01`,
        endDate: `${currentYear}-12-31`,
        periodLabel: `Tahun Berjalan (${currentYear})`,
      };
    }
    return {
      startDate: null,
      endDate: null,
      periodLabel: "Semua Periode Tercatat",
    };
  }, [periodFilter]);

  // Kalkulasi P&L berdasarkan filter
  const pnl = useMemo(() => {
    return calculatePnL(transactions, startDate, endDate);
  }, [transactions, startDate, endDate]);

  // Total Piutang Usaha
  const accountsReceivable = orders
    .filter((o) => o.paymentStatus !== "Lunas" && o.status !== "Dibatalkan")
    .reduce((sum, o) => sum + (o.grandTotal || 0), 0);

  // Total Kas & Bank
  const totalCashBank = accountBalances
    .filter((a) => a.type !== "Kartu Kredit")
    .reduce((sum, a) => sum + (a.currentBalance || 0), 0);

  // Total Aset Lancar = Kas/Bank + Stok Fisik + Piutang Usaha
  const totalCurrentAssets = totalCashBank + inventoryValuation.totalCostValuation + accountsReceivable;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="reports-page">
      {/* Header & Controls */}
      <div className="page-header-flex">
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 700 }}>Laporan Keuangan &amp; Laba Rugi</h2>
          <p style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
            Laporan kinerja finansial resmi: Laba Rugi (P&amp;L), Arus Kas, dan Neraca Aset Bisnis.
          </p>
        </div>

        <div className="page-header-actions">
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-strong)",
              fontSize: "13px",
              backgroundColor: "#ffffff",
            }}
          >
            <option value="thisMonth">Periode: Bulan Ini</option>
            <option value="thisYear">Periode: Tahun Ini</option>
            <option value="all">Periode: Semua Waktu</option>
          </select>

          <button type="button" className="btn-primary" onClick={handlePrint}>
            <Printer size={16} /> Cetak Laporan
          </button>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="stats-grid-3" style={{ marginBottom: "24px" }}>
        <div className="stat-card stat-card-emerald" style={{ padding: "18px 20px" }}>
          <span className="stat-card-title">Total Pendapatan Usaha</span>
          <div className="stat-card-value text-emerald">{formatRp(pnl.totalRevenue)}</div>
          <span className="stat-card-sub">{periodLabel}</span>
        </div>

        <div className="stat-card stat-card-rose" style={{ padding: "18px 20px" }}>
          <span className="stat-card-title">Total Beban &amp; Pengeluaran</span>
          <div className="stat-card-value text-rose">{formatRp(pnl.totalExpenses)}</div>
          <span className="stat-card-sub">HPP + Biaya Operasional</span>
        </div>

        <div className="stat-card stat-card-gold" style={{ padding: "18px 20px" }}>
          <span className="stat-card-title">Laba Bersih (Net Profit)</span>
          <div className="stat-card-value" style={{ color: pnl.netProfit >= 0 ? "var(--emerald-dark)" : "var(--rose-dark)" }}>
            {formatRp(pnl.netProfit)}
          </div>
          <span className="stat-card-sub">Profit Margin: {pnl.profitMargin.toFixed(1)}%</span>
        </div>
      </div>

      {/* DOKUMEN LAPORAN LABA RUGI (P&L) */}
      <div className="panel-card" id="pnl-statement-doc" style={{ padding: "32px", marginBottom: "24px" }}>
        <div style={{ textAlign: "center", marginBottom: "28px", borderBottom: "2px solid var(--border-subtle)", paddingBottom: "18px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-primary)" }}>
            {profile?.name || "ZENTA Business"}
          </h1>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-secondary)", letterSpacing: "0.04em", marginTop: "4px" }}>
            LAPORAN LABA RUGI (PROFIT &amp; LOSS STATEMENT)
          </h2>
          <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginTop: "4px" }}>
            Periode: <strong>{periodLabel}</strong> (Mata Uang: IDR)
          </p>
        </div>

        {/* Section 1: Pendapatan */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "var(--bg-panel-subtle)", padding: "10px 14px", borderRadius: "var(--radius-sm)", fontWeight: 700, fontSize: "13.5px" }}>
            <span>I. PENDAPATAN OPERASIONAL (REVENUE)</span>
            <span style={{ fontFamily: "var(--font-mono)" }}>{formatRp(pnl.totalRevenue)}</span>
          </div>

          <div style={{ padding: "8px 14px", display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px" }}>
            {Object.entries(pnl.incomeByCategory).map(([cat, val]) => (
              <div key={cat} style={{ display: "flex", justifyContent: "space-between", paddingLeft: "16px" }}>
                <span style={{ color: "var(--text-secondary)" }}>{cat}</span>
                <span style={{ fontFamily: "var(--font-mono)" }}>{formatRp(val)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: HPP & Laba Kotor */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "var(--bg-panel-subtle)", padding: "10px 14px", borderRadius: "var(--radius-sm)", fontWeight: 700, fontSize: "13.5px" }}>
            <span>II. BEBAN POKOK PENJUALAN (HPP / COGS)</span>
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--rose-dark)" }}>- {formatRp(pnl.cogs)}</span>
          </div>

          <div style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)", marginTop: "8px", fontWeight: 700, fontSize: "14px" }}>
            <span>LABA KOTOR (GROSS PROFIT):</span>
            <span style={{ fontFamily: "var(--font-mono)", color: pnl.grossProfit >= 0 ? "var(--emerald-dark)" : "var(--rose-dark)" }}>
              {formatRp(pnl.grossProfit)}
            </span>
          </div>
        </div>

        {/* Section 3: Beban Operasional */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "var(--bg-panel-subtle)", padding: "10px 14px", borderRadius: "var(--radius-sm)", fontWeight: 700, fontSize: "13.5px" }}>
            <span>III. BEBAN OPERASIONAL (OPERATING EXPENSES)</span>
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--rose-dark)" }}>- {formatRp(pnl.operationalExpenses)}</span>
          </div>

          <div style={{ padding: "8px 14px", display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px" }}>
            {Object.entries(pnl.expenseByCategory)
              .filter(([cat]) => cat !== "Beban Pokok Penjualan (HPP)")
              .map(([cat, val]) => (
                <div key={cat} style={{ display: "flex", justifyContent: "space-between", paddingLeft: "16px" }}>
                  <span style={{ color: "var(--text-secondary)" }}>{cat}</span>
                  <span style={{ fontFamily: "var(--font-mono)" }}>{formatRp(val)}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Section 4: Laba Bersih */}
        <div style={{ backgroundColor: pnl.netProfit >= 0 ? "var(--emerald-soft)" : "var(--rose-soft)", border: `1px solid ${pnl.netProfit >= 0 ? "var(--emerald-border)" : "var(--rose-border)"}`, borderRadius: "var(--radius-md)", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: pnl.netProfit >= 0 ? "var(--emerald-dark)" : "var(--rose-dark)" }}>
              LABA BERSIH TAHUN/BULAN BERJALAN (NET PROFIT)
            </span>
            <p style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "2px" }}>
              Total pendapatan dikurangi seluruh beban pokok dan biaya operasional
            </p>
          </div>

          <div style={{ textAlign: "right" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "22px", fontWeight: 800, color: pnl.netProfit >= 0 ? "var(--emerald-dark)" : "var(--rose-dark)" }}>
              {formatRp(pnl.netProfit)}
            </span>
          </div>
        </div>
      </div>

      {/* Ringkasan Neraca Aset Lancar */}
      <div className="panel-card">
        <div className="panel-header">
          <div>
            <h3 className="panel-title">Ringkasan Struktur Aset Lancar</h3>
            <p className="panel-subtitle">Likuiditas kas, nilai modal inventori, dan piutang tagihan klien</p>
          </div>
        </div>

        <div className="report-assets-grid">
          <div style={{ padding: "14px", backgroundColor: "var(--bg-panel-subtle)", borderRadius: "var(--radius-md)" }}>
            <span style={{ fontSize: "11.5px", color: "var(--text-muted)", display: "block" }}>1. Saldo Kas &amp; Bank</span>
            <strong style={{ fontFamily: "var(--font-mono)", fontSize: "15px" }}>{formatRp(totalCashBank)}</strong>
          </div>

          <div style={{ padding: "14px", backgroundColor: "var(--bg-panel-subtle)", borderRadius: "var(--radius-md)" }}>
            <span style={{ fontSize: "11.5px", color: "var(--text-muted)", display: "block" }}>2. Nilai Aset Stok (HPP)</span>
            <strong style={{ fontFamily: "var(--font-mono)", fontSize: "15px" }}>{formatRp(inventoryValuation.totalCostValuation)}</strong>
          </div>

          <div style={{ padding: "14px", backgroundColor: "var(--bg-panel-subtle)", borderRadius: "var(--radius-md)" }}>
            <span style={{ fontSize: "11.5px", color: "var(--text-muted)", display: "block" }}>3. Piutang Usaha (Invoice)</span>
            <strong style={{ fontFamily: "var(--font-mono)", fontSize: "15px" }}>{formatRp(accountsReceivable)}</strong>
          </div>

          <div style={{ padding: "14px", backgroundColor: "var(--emerald-soft)", borderRadius: "var(--radius-md)", border: "1px solid var(--emerald-border)" }}>
            <span style={{ fontSize: "11.5px", color: "var(--emerald-dark)", fontWeight: 600, display: "block" }}>Total Aset Lancar</span>
            <strong style={{ fontFamily: "var(--font-mono)", fontSize: "16px", color: "var(--emerald-dark)" }}>{formatRp(totalCurrentAssets)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
