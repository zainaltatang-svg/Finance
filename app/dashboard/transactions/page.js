"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Download, Search, Filter, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useFinance } from "../../../context/FinanceContext";
import { useToast } from "../../../components/ui/Toast";
import { useConfirm } from "../../../components/ui/ConfirmModal";
import { formatRp, formatDate, todayISO } from "../../../lib/formatters";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "../../../lib/constants";
import TransactionModal from "../../../components/finance/TransactionModal";

export default function TransactionsPage() {
  const {
    transactions,
    accounts,
    deleteTransaction,
    exportCSV,
    getAccountName,
  } = useFinance();

  const toast = useToast();
  const { confirm } = useConfirm();

  const [modalType, setModalType] = useState(null); // 'income' | 'expense' | null
  const [filterType, setFilterType] = useState("all"); // 'all' | 'income' | 'expense'
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterAccountId, setFilterAccountId] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("all"); // 'all', 'thisMonth', 'lastMonth', 'thisYear'

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Filter logika
  const filteredTransactions = useMemo(() => {
    const today = todayISO();
    const currentMonth = today.slice(0, 7);
    const currentYear = today.slice(0, 4);

    return transactions.filter((tx) => {
      // Tipe
      if (filterType !== "all" && tx.type !== filterType) return false;

      // Kategori
      if (filterCategory !== "all" && tx.category !== filterCategory) return false;

      // Akun
      if (filterAccountId !== "all" && tx.accountId !== filterAccountId) return false;

      // Rentang Waktu
      if (dateRange === "thisMonth" && (!tx.date || !tx.date.startsWith(currentMonth))) return false;
      if (dateRange === "thisYear" && (!tx.date || !tx.date.startsWith(currentYear))) return false;

      // Pencarian
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const noteMatch = tx.notes?.toLowerCase().includes(q);
        const catMatch = tx.category?.toLowerCase().includes(q);
        const accMatch = getAccountName(tx.accountId)?.toLowerCase().includes(q);
        const amountMatch = String(tx.amount).includes(q);
        if (!noteMatch && !catMatch && !accMatch && !amountMatch) return false;
      }

      return true;
    });
  }, [transactions, filterType, filterCategory, filterAccountId, dateRange, searchQuery, getAccountName]);

  // Reset pagination saat filter berubah
  const [prevFilter, setPrevFilter] = useState({
    type: filterType,
    category: filterCategory,
    account: filterAccountId,
    date: dateRange,
    query: searchQuery,
  });

  if (
    prevFilter.type !== filterType ||
    prevFilter.category !== filterCategory ||
    prevFilter.account !== filterAccountId ||
    prevFilter.date !== dateRange ||
    prevFilter.query !== searchQuery
  ) {
    setPrevFilter({
      type: filterType,
      category: filterCategory,
      account: filterAccountId,
      date: dateRange,
      query: searchQuery,
    });
    setCurrentPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  // Hitung total dari hasil filter
  const { totalIncome, totalExpense, balance } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    filteredTransactions.forEach((t) => {
      const amt = Number(t.amount) || 0;
      if (t.type === "income") inc += amt;
      else if (t.type === "expense") exp += amt;
    });
    return {
      totalIncome: inc,
      totalExpense: exp,
      balance: inc - exp,
    };
  }, [filteredTransactions]);

  // Kategori dinamis untuk filter
  const availableCategories = useMemo(() => {
    if (filterType === "income") return INCOME_CATEGORIES;
    if (filterType === "expense") return EXPENSE_CATEGORIES;
    return [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];
  }, [filterType]);

  const handleDelete = async (tx) => {
    const isConfirmed = await confirm({
      title: "Hapus Transaksi",
      message: `Hapus catatan transaksi ${tx.type === "income" ? "pemasukan" : "pengeluaran"} sebesar ${formatRp(tx.amount)} (${tx.category})?`,
      confirmText: "Hapus Transaksi",
      cancelText: "Batal",
      danger: true,
    });

    if (isConfirmed) {
      deleteTransaction(tx.id);
      toast.success("Catatan transaksi berhasil dihapus.");
    }
  };

  const handleExport = () => {
    exportCSV();
    toast.success("Laporan CSV berhasil diunduh.");
  };

  return (
    <div className="transactions-page">
      {/* Page Header */}
      <div className="page-header-flex">
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 700 }}>Mutasi &amp; Riwayat Transaksi</h2>
          <p style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
            Kelola seluruh arus kas masuk dan kas keluar entitas bisnis secara transparan.
          </p>
        </div>

        <div className="page-header-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleExport}
            title="Ekspor daftar ini ke format CSV"
          >
            <Download size={16} /> Ekspor CSV
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setModalType("income")}
          >
            <Plus size={16} /> Catat Pemasukan
          </button>
          <button
            type="button"
            className="btn-primary"
            style={{ backgroundColor: "var(--rose-primary)" }}
            onClick={() => setModalType("expense")}
          >
            <Plus size={16} /> Catat Pengeluaran
          </button>
        </div>
      </div>

      {/* Highlights Bar */}
      <div className="stats-grid-3" style={{ marginBottom: "20px" }}>
        <div className="stat-card stat-card-emerald">
          <span className="stat-card-title">Total Pemasukan (Filter)</span>
          <div className="stat-card-value text-emerald">{formatRp(totalIncome)}</div>
          <span className="stat-card-sub">Dari {filteredTransactions.filter((t) => t.type === "income").length} transaksi</span>
        </div>

        <div className="stat-card stat-card-rose">
          <span className="stat-card-title">Total Pengeluaran (Filter)</span>
          <div className="stat-card-value text-rose">{formatRp(totalExpense)}</div>
          <span className="stat-card-sub">Dari {filteredTransactions.filter((t) => t.type === "expense").length} transaksi</span>
        </div>

        <div className="stat-card stat-card-gold">
          <span className="stat-card-title">Arus Kas Bersih (Net Cash Flow)</span>
          <div className="stat-card-value" style={{ color: balance >= 0 ? "var(--emerald-dark)" : "var(--rose-dark)" }}>
            {formatRp(balance)}
          </div>
          <span className="stat-card-sub">{balance >= 0 ? "Surplus Finansial" : "Defisit Finansial"}</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="panel-card" style={{ marginBottom: "16px", padding: "16px 20px" }}>
        <div className="filter-toolbar-grid">
          {/* Search */}
          <div className="search-box" style={{ position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Cari transaksi, nominal, akun..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 34px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-strong)",
                fontSize: "13px",
              }}
            />
          </div>

          {/* Filter Tipe */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-strong)", fontSize: "13px" }}
          >
            <option value="all">Semua Jenis Transaksi</option>
            <option value="income">Hanya Pemasukan</option>
            <option value="expense">Hanya Pengeluaran</option>
          </select>

          {/* Filter Kategori */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-strong)", fontSize: "13px" }}
          >
            <option value="all">Semua Kategori</option>
            {availableCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Filter Akun Rekening */}
          <select
            value={filterAccountId}
            onChange={(e) => setFilterAccountId(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-strong)", fontSize: "13px" }}
          >
            <option value="all">Semua Rekening Kas/Bank</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          {/* Filter Waktu */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-strong)", fontSize: "13px" }}
          >
            <option value="all">Semua Waktu</option>
            <option value="thisMonth">Bulan Ini</option>
            <option value="thisYear">Tahun Berjalan</option>
          </select>
        </div>
      </div>

      {/* Tabel Transaksi */}
      <div className="panel-card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table className="app-table">
            <thead>
              <tr>
                <th style={{ width: "110px" }}>Tanggal</th>
                <th style={{ width: "100px" }}>Jenis</th>
                <th>Deskripsi / Catatan</th>
                <th>Kategori</th>
                <th>Rekening</th>
                <th style={{ textAlign: "right", width: "150px" }}>Nominal (IDR)</th>
                <th style={{ width: "50px", textAlign: "center" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "36px", color: "var(--text-muted)" }}>
                    Tidak ada catatan transaksi yang sesuai kriteria pencarian / filter.
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td style={{ whiteSpace: "nowrap", color: "var(--text-muted)" }}>
                      {formatDate(tx.date)}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          tx.type === "income" ? "badge-emerald" : "badge-rose"
                        }`}
                      >
                        {tx.type === "income" ? "Pemasukan" : "Pengeluaran"}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{tx.notes || "—"}</div>
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>{tx.category}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{getAccountName(tx.accountId)}</td>
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
                    <td style={{ textAlign: "center" }}>
                      <button
                        type="button"
                        className="icon-del-btn"
                        onClick={() => handleDelete(tx)}
                        title="Hapus Transaksi"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {filteredTransactions.length > pageSize && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 20px",
              borderTop: "1px solid var(--border-subtle)",
              fontSize: "12.5px",
              color: "var(--text-secondary)",
            }}
          >
            <div>
              Menampilkan <strong>{Math.min(filteredTransactions.length, (currentPage - 1) * pageSize + 1)}</strong> -{" "}
              <strong>{Math.min(filteredTransactions.length, currentPage * pageSize)}</strong> dari{" "}
              <strong>{filteredTransactions.length}</strong> transaksi
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{ padding: "4px 8px" }}
              >
                <ChevronLeft size={16} /> Sebelumnya
              </button>

              <span style={{ padding: "0 8px", fontWeight: 600 }}>
                Halaman {currentPage} dari {totalPages}
              </span>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{ padding: "4px 8px" }}
              >
                Berikutnya <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Input Transaksi */}
      {modalType && (
        <TransactionModal
          isOpen={true}
          defaultType={modalType}
          onClose={() => setModalType(null)}
        />
      )}
    </div>
  );
}
