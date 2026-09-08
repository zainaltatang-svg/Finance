"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertTriangle,
  Receipt,
  Building,
  Plus,
  ArrowLeftRight,
  TrendingUp,
} from "lucide-react";
import { useFinance } from "../../context/FinanceContext";
import { formatRp, formatDate } from "../../lib/formatters";
import { calculatePnL } from "../../lib/calculations";
import StatCard from "../../components/ui/StatCard";
import Badge from "../../components/ui/Badge";
import CashFlowChart from "../../components/charts/CashFlowChart";
import ExpenseDonut from "../../components/charts/ExpenseDonut";
import TransactionModal from "../../components/finance/TransactionModal";
import TransferModal from "../../components/finance/TransferModal";

export default function DashboardOverviewPage() {
  const {
    isLoaded,
    accountBalances,
    netWorthSummary,
    transactions,
    orders,
    products,
    monthlyTrends,
    getAccountName,
  } = useFinance();

  const [txModalType, setTxModalType] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);

  if (!isLoaded) {
    return (
      <div className="dashboard-loading">
        <p>Menyiapkan workspace ZENTA Finance...</p>
      </div>
    );
  }

  // Hitung metrik bulan berjalan
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthTransactions = transactions.filter(
    (t) => t.date && t.date.startsWith(currentMonth)
  );
  const pnlCurrentMonth = calculatePnL(currentMonthTransactions);

  // Hitung total piutang yang belum dibayar
  const unpaidInvoicesTotal = orders
    .filter((o) => o.paymentStatus !== "Lunas" && o.status !== "Dibatalkan")
    .reduce((sum, o) => sum + (o.grandTotal || 0), 0);

  // Produk stok menipis
  const lowStockProducts = products.filter(
    (p) => Number(p.stock || 0) <= Number(p.minStock || 5)
  );

  // 5 transaksi terbaru
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="dashboard-overview-page">
      {/* Peringatan Stok Kritis jika ada */}
      {lowStockProducts.length > 0 && (
        <div className="stock-alert-banner panel-card" style={{ padding: "14px 18px", marginBottom: "20px", borderColor: "var(--amber-border)", backgroundColor: "var(--amber-soft)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--amber-dark)" }}>
              <AlertTriangle size={18} />
              <span style={{ fontWeight: 600 }}>
                Perhatian: Terdapat {lowStockProducts.length} produk dengan stok kritis di bawah batas minimum.
              </span>
            </div>
            <Link href="/dashboard/inventory" className="btn-secondary btn-sm" style={{ backgroundColor: "#ffffff" }}>
              Kelola Stok Inventori &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* Row 1: KPI Stat Cards */}
      <div className="stats-grid-4">
        <StatCard
          title="Nilai Bersih Kekayaan"
          value={formatRp(netWorthSummary.netWorth)}
          subtitle={`Aset: ${formatRp(netWorthSummary.totalAssets)}`}
          icon={Wallet}
          variant="gold"
          trend={{ value: "Sehat", isPositive: true }}
        />

        <StatCard
          title="Pemasukan (Bulan Ini)"
          value={formatRp(pnlCurrentMonth.totalRevenue)}
          subtitle={`${pnlCurrentMonth.transactionCount} transaksi tercatat`}
          icon={ArrowDownCircle}
          variant="emerald"
        />

        <StatCard
          title="Pengeluaran (Bulan Ini)"
          value={formatRp(pnlCurrentMonth.totalExpenses)}
          subtitle={`Laba Bersih: ${formatRp(pnlCurrentMonth.netProfit)}`}
          icon={ArrowUpCircle}
          variant="rose"
        />

        <StatCard
          title="Piutang / Tagihan Berjalan"
          value={formatRp(unpaidInvoicesTotal)}
          subtitle={`${orders.filter((o) => o.paymentStatus !== "Lunas").length} invoice belum lunas`}
          icon={Receipt}
          variant="blue"
        />
      </div>

      {/* Row 2: Charts (Cash Flow Trend + Expense Donut) */}
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.9fr", gap: "24px", marginBottom: "24px" }}>
        <div className="panel-card" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Tren Arus Kas (6 Bulan Terakhir)</h3>
              <p className="panel-subtitle">Perbandingan pemasukan vs pengeluaran operasional bisnis</p>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                className="btn-text-action text-emerald"
                onClick={() => setTxModalType("income")}
              >
                <Plus size={14} /> Pemasukan
              </button>
              <button
                type="button"
                className="btn-text-action text-rose"
                onClick={() => setTxModalType("expense")}
              >
                <Plus size={14} /> Pengeluaran
              </button>
            </div>
          </div>
          <CashFlowChart data={monthlyTrends} />
        </div>

        <div className="panel-card" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Alokasi Beban &amp; Biaya</h3>
              <p className="panel-subtitle">Distribusi pengeluaran berdasarkan kategori bulan ini</p>
            </div>
          </div>
          <ExpenseDonut categoryData={pnlCurrentMonth.expenseByCategory} />
        </div>
      </div>

      {/* Row 3: Rekening Bank Ringkas & Transaksi Terbaru */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "24px" }}>
        {/* Rekening Card */}
        <div className="panel-card" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Rekening Bank &amp; Kas</h3>
              <p className="panel-subtitle">Saldo riil di seluruh akun keuangan</p>
            </div>
            <button
              type="button"
              className="btn-text-action text-blue"
              onClick={() => setShowTransferModal(true)}
            >
              <ArrowLeftRight size={14} /> Transfer
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {accountBalances.map((acc) => (
              <div
                key={acc.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                  backgroundColor: "var(--bg-panel-subtle)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: "#ffffff",
                      border: "1px solid var(--border-subtle)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <Building size={16} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: "13.5px", fontWeight: 700 }}>{acc.name}</h4>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      {acc.type} {acc.accountNumber !== "-" ? `• ${acc.accountNumber}` : ""}
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "14px" }}>
                    {formatRp(acc.currentBalance)}
                  </div>
                  <span style={{ fontSize: "11px", color: acc.currentBalance >= 0 ? "var(--emerald-dark)" : "var(--rose-dark)" }}>
                    {acc.currentBalance >= 0 ? "Saldo Positif" : "Defisit"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "16px", textAlign: "center" }}>
            <Link href="/dashboard/accounts" className="btn-text-action" style={{ fontSize: "12.5px" }}>
              Lihat Detail &amp; Mutasi Semua Rekening &rarr;
            </Link>
          </div>
        </div>

        {/* Transaksi Terbaru */}
        <div className="panel-card" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Mutasi Transaksi Terbaru</h3>
              <p className="panel-subtitle">5 riwayat transaksi terakhir yang tercatat</p>
            </div>
            <Link href="/dashboard/transactions" className="btn-text-action">
              Lihat Semua &rarr;
            </Link>
          </div>

          <div className="table-responsive">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Keterangan / Kategori</th>
                  <th>Rekening</th>
                  <th style={{ textAlign: "right" }}>Nominal</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)" }}>
                      Belum ada transaksi yang tercatat.
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((tx) => (
                    <tr key={tx.id}>
                      <td style={{ whiteSpace: "nowrap", color: "var(--text-muted)" }}>
                        {formatDate(tx.date)}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{tx.notes || tx.category}</div>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          {tx.category}
                        </span>
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>
                        {getAccountName(tx.accountId)}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span
                          className="num-cell"
                          style={{
                            color: tx.type === "income" ? "var(--emerald-dark)" : "var(--rose-dark)",
                          }}
                        >
                          {tx.type === "income" ? "+ " : "- "}
                          {formatRp(tx.amount)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      {txModalType && (
        <TransactionModal
          isOpen={true}
          defaultType={txModalType}
          onClose={() => setTxModalType(null)}
        />
      )}

      {showTransferModal && (
        <TransferModal
          isOpen={true}
          onClose={() => setShowTransferModal(false)}
        />
      )}
    </div>
  );
}
