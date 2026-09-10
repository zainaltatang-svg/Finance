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
  Database,
  Sparkles,
  Loader2,
  ShoppingCart,
} from "lucide-react";
import { useFinance } from "../../context/FinanceContext";
import { useToast } from "../../components/ui/Toast";
import { formatRp, formatDate, currentMonthISO } from "../../lib/formatters";
import { calculatePnL } from "../../lib/calculations";
import StatCard from "../../components/ui/StatCard";
import CashFlowChart from "../../components/charts/CashFlowChart";
import ExpenseDonut from "../../components/charts/ExpenseDonut";
import TransactionModal from "../../components/finance/TransactionModal";
import TransferModal from "../../components/finance/TransferModal";
import InvoiceModal from "../../components/sales/InvoiceModal";
import { StatCardSkeleton, Skeleton } from "../../components/ui/Skeleton";

export default function DashboardOverviewPage() {
  const {
    isLoaded,
    isSyncing,
    isCloudEmpty,
    seedCloudData,
    accountBalances,
    netWorthSummary,
    transactions,
    orders,
    products,
    monthlyTrends,
    getAccountName,
  } = useFinance();

  const toast = useToast();
  const [txModalType, setTxModalType] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      await seedCloudData();
      toast.success("Data contoh bisnis berhasil diisi ke database Supabase Cloud!");
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengisi data contoh ke cloud: " + (err.message || ""));
    } finally {
      setIsSeeding(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="dashboard-overview-page">
        <div className="stats-grid-4" style={{ marginBottom: "20px" }}>
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <div className="dashboard-skeleton-grid">
          <div className="panel-card" style={{ minHeight: "260px", padding: "20px" }}>
            <Skeleton width="40%" height="20px" style={{ marginBottom: "16px" }} />
            <Skeleton width="100%" height="180px" />
          </div>
          <div className="panel-card" style={{ minHeight: "260px", padding: "20px" }}>
            <Skeleton width="40%" height="20px" style={{ marginBottom: "16px" }} />
            <Skeleton width="100%" height="180px" />
          </div>
        </div>
      </div>
    );
  }

  // Hitung metrik bulan berjalan
  const currentMonth = currentMonthISO();
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
      {/* Onboarding Banner untuk Akun Baru (Database Cloud Masih Kosong) */}
      {isCloudEmpty && (
        <div className="cloud-onboarding-banner">
          <div className="onboarding-banner-header">
            <div className="onboarding-banner-icon">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="onboarding-banner-title">
                Selamat Datang di Warung Kelontong Berkah! Database Cloud Siap.
              </h3>
              <p className="onboarding-banner-desc">
                Sistem terhubung langsung dengan database Supabase Cloud. Anda dapat mengisi template data contoh sembako untuk langsung mencoba seluruh fitur kasir, kasbon, dan laporan.
              </p>
            </div>
          </div>
          <div className="onboarding-banner-actions">
            <button
              type="button"
              className="btn-primary btn-sm"
              disabled={isSeeding || isSyncing}
              onClick={handleSeedData}
            >
              {isSeeding ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Mengisi Data Cloud...</span>
                </>
              ) : (
                <>
                  <Database size={15} />
                  <span>Isi Data Contoh Warung ke Cloud</span>
                </>
              )}
            </button>
            <Link href="/dashboard/accounts" className="btn-secondary btn-sm">
              <Plus size={15} />
              <span>Buat Rekening Kas Sendiri</span>
            </Link>
          </div>
        </div>
      )}

      {/* Peringatan Stok Kritis Sembako (Perlu Kulakan) */}
      {lowStockProducts.length > 0 && (
        <div className="stock-alert-card">
          <div className="stock-alert-left">
            <div className="stock-alert-icon">
              <AlertTriangle size={18} />
            </div>
            <div className="stock-alert-text">
              <strong>Peringatan Stok Kritis ({lowStockProducts.length} barang):</strong>
              <span>
                {lowStockProducts.slice(0, 3).map((p) => p.name).join(", ")}
                {lowStockProducts.length > 3 ? ` dan ${lowStockProducts.length - 3} barang lainnya` : ""} perlu segera kulakan.
              </span>
            </div>
          </div>
          <Link href="/dashboard/inventory" className="btn-stock-alert">
            Cek Barang &amp; Kulakan &rarr;
          </Link>
        </div>
      )}

      {/* Baris Aksi Cepat Warung (Kasir Baru, Catat Pemasukan, Kulakan, Transfer) */}
      <div className="dashboard-quick-actions-bar">
        <button
          type="button"
          className="dash-quick-btn dash-quick-pos"
          onClick={() => setShowInvoiceModal(true)}
        >
          <div className="dash-quick-icon-wrap pos-icon">
            <Receipt size={18} />
          </div>
          <div className="dash-quick-label">
            <strong>Kasir / Transaksi Baru</strong>
            <span>Hitung belanja &amp; kembalian</span>
          </div>
        </button>

        <button
          type="button"
          className="dash-quick-btn dash-quick-income"
          onClick={() => setTxModalType("income")}
        >
          <div className="dash-quick-icon-wrap income-icon">
            <ArrowDownCircle size={18} />
          </div>
          <div className="dash-quick-label">
            <strong>Catat Pemasukan</strong>
            <span>Uang masuk kas toko</span>
          </div>
        </button>

        <button
          type="button"
          className="dash-quick-btn dash-quick-expense"
          onClick={() => setTxModalType("expense")}
        >
          <div className="dash-quick-icon-wrap expense-icon">
            <ArrowUpCircle size={18} />
          </div>
          <div className="dash-quick-label">
            <strong>Belanja Kulakan</strong>
            <span>Stok sembako pasar/agen</span>
          </div>
        </button>

        <button
          type="button"
          className="dash-quick-btn dash-quick-transfer"
          onClick={() => setShowTransferModal(true)}
        >
          <div className="dash-quick-icon-wrap transfer-icon">
            <ArrowLeftRight size={18} />
          </div>
          <div className="dash-quick-label">
            <strong>Pindah Kas / Transfer</strong>
            <span>Setor tunai ke rekening</span>
          </div>
        </button>
      </div>

      {/* Row 1: KPI Stat Cards Warung */}
      <div className="stats-grid-4">
        <StatCard
          title="Total Kas Toko & Bank"
          value={formatRp(netWorthSummary.netWorth)}
          subtitle={`Aset Kas: ${formatRp(netWorthSummary.totalAssets)}`}
          icon={Wallet}
          variant="gold"
          trend={{ value: "Aman", isPositive: true }}
        />

        <StatCard
          title="Omset Penjualan (Bulan Ini)"
          value={formatRp(pnlCurrentMonth.totalRevenue)}
          subtitle={`${pnlCurrentMonth.transactionCount} transaksi kasir tercatat`}
          icon={ArrowDownCircle}
          variant="emerald"
        />

        <StatCard
          title="Kulakan & Biaya (Bulan Ini)"
          value={formatRp(pnlCurrentMonth.totalExpenses)}
          subtitle={`Untung: ${formatRp(pnlCurrentMonth.netProfit)}`}
          icon={ArrowUpCircle}
          variant="rose"
        />

        <StatCard
          title="Buku Kasbon Warga"
          value={formatRp(unpaidInvoicesTotal)}
          subtitle={`${orders.filter((o) => o.paymentStatus !== "Lunas").length} orang belum lunas`}
          icon={Receipt}
          variant="blue"
        />
      </div>

      {/* Row 2: Charts (Cash Flow Trend + Expense Donut) */}
      <div className="dashboard-charts-grid">
        <div className="panel-card" style={{ marginBottom: 0 }}>
          <div className="panel-header" style={{ flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h3 className="panel-title">Tren Arus Kas (6 Bulan Terakhir)</h3>
              <p className="panel-subtitle">Perbandingan pemasukan vs pengeluaran operasional bisnis</p>
            </div>
            <div className="panel-header-pills">
              <button
                type="button"
                className="chart-action-pill pill-income"
                onClick={() => setTxModalType("income")}
              >
                <Plus size={13} /> Pemasukan
              </button>
              <button
                type="button"
                className="chart-action-pill pill-expense"
                onClick={() => setTxModalType("expense")}
              >
                <Plus size={13} /> Pengeluaran
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
      <div className="dashboard-bottom-grid">
        {/* Rekening Card */}
        <div className="panel-card" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Rekening Bank &amp; Kas</h3>
              <p className="panel-subtitle">Saldo riil di seluruh akun keuangan</p>
            </div>
            <button
              type="button"
              className="chart-action-pill pill-transfer"
              onClick={() => setShowTransferModal(true)}
            >
              <ArrowLeftRight size={13} /> Transfer
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
            {accountBalances.map((acc) => (
              <div key={acc.id} className="dash-account-item">
                <div className="dash-account-left">
                  <div className="dash-account-icon">
                    <Building size={16} />
                  </div>
                  <div className="dash-account-text">
                    <h4 className="dash-account-title">{acc.name}</h4>
                    <span className="dash-account-sub">
                      {acc.type} {acc.accountNumber !== "-" ? `• ${acc.accountNumber}` : ""}
                    </span>
                  </div>
                </div>

                <div className="dash-account-right">
                  <div className="dash-account-val">
                    {formatRp(acc.currentBalance)}
                  </div>
                  <span className={`dash-account-status ${acc.currentBalance >= 0 ? "status-pos" : "status-neg"}`}>
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

          {/* Mode Desktop: Tabel 4 Kolom */}
          <div className="dashboard-tx-desktop">
            <div className="table-responsive">
              <table className="app-table">
                <thead>
                  <tr>
                    <th style={{ width: "115px", whiteSpace: "nowrap" }}>Tanggal</th>
                    <th>Keterangan / Kategori</th>
                    <th style={{ width: "170px" }}>Rekening</th>
                    <th style={{ textAlign: "right", width: "150px", whiteSpace: "nowrap" }}>Nominal</th>
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
                        <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                          <span
                            className="num-cell"
                            style={{
                              color: tx.type === "income" ? "var(--emerald-dark)" : "var(--rose-dark)",
                              whiteSpace: "nowrap",
                              display: "inline-block",
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

          {/* Mode Mobile: Feed Card List (100% Responsif, Tanpa Horizontal Scroll) */}
          <div className="dashboard-tx-mobile">
            {recentTransactions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)", fontSize: "13px" }}>
                Belum ada transaksi yang tercatat.
              </div>
            ) : (
              <div className="dash-tx-list">
                {recentTransactions.map((tx) => {
                  const isIncome = tx.type === "income";
                  return (
                    <div key={tx.id} className="dash-tx-card">
                      <div className={`dash-tx-icon-wrap ${isIncome ? "income" : "expense"}`}>
                        {isIncome ? <ArrowDownCircle size={18} /> : <ArrowUpCircle size={18} />}
                      </div>
                      <div className="dash-tx-content">
                        <div className="dash-tx-top">
                          <span className="dash-tx-title">{tx.notes || tx.category}</span>
                          <span className={`dash-tx-amount ${isIncome ? "text-emerald" : "text-rose"}`}>
                            {isIncome ? "+ " : "- "}
                            {formatRp(tx.amount)}
                          </span>
                        </div>
                        <div className="dash-tx-meta">
                          <span>{formatDate(tx.date)}</span>
                          <span>•</span>
                          <span>{getAccountName(tx.accountId)}</span>
                          <span>•</span>
                          <span className="dash-tx-cat-badge">{tx.category}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showInvoiceModal && (
        <InvoiceModal
          isOpen={true}
          onClose={() => setShowInvoiceModal(false)}
        />
      )}

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
