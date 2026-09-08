"use client";

import { useState, useMemo } from "react";
import { Plus, Download, Search, Filter, Trash2 } from "lucide-react";
import { useFinance } from "../../../context/FinanceContext";
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

  const [modalType, setModalType] = useState(null); // 'income' | 'expense' | null
  const [filterType, setFilterType] = useState("all"); // 'all' | 'income' | 'expense'
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterAccountId, setFilterAccountId] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("all"); // 'all', 'thisMonth', 'lastMonth', 'thisYear'

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

  // Hitung total dari hasil filter
  const totalIncomeFiltered = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalExpenseFiltered = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const netFiltered = totalIncomeFiltered - totalExpenseFiltered;

  // Daftar kategori yang tersedia untuk filter
  const allCategories = useMemo(() => {
    if (filterType === "income") return INCOME_CATEGORIES;
    if (filterType === "expense") return EXPENSE_CATEGORIES;
    return [...new Set([...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES])];
  }, [filterType]);

  return (
    <div className="transactions-page">
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 700 }}>Mutasi Seluruh Transaksi</h2>
          <p style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
            Kelola, telusuri, filter, dan ekspor riwayat arus kas bisnis Anda.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={exportCSV}
            title="Unduh berkas CSV"
          >
            <Download size={16} /> Ekspor CSV
          </button>
          <button
            type="button"
            className="btn-emerald"
            onClick={() => setModalType("income")}
          >
            <Plus size={16} /> Catat Pemasukan
          </button>
          <button
            type="button"
            className="btn-rose"
            onClick={() => setModalType("expense")}
          >
            <Plus size={16} /> Catat Pengeluaran
          </button>
        </div>
      </div>

      {/* Ringkasan Filter Banner */}
      <div className="stats-grid-3" style={{ marginBottom: "20px" }}>
        <div className="stat-card stat-card-emerald" style={{ padding: "16px 20px" }}>
          <span className="stat-card-title">Total Pemasukan (Filter)</span>
          <div className="stat-card-value text-emerald">{formatRp(totalIncomeFiltered)}</div>
        </div>

        <div className="stat-card stat-card-rose" style={{ padding: "16px 20px" }}>
          <span className="stat-card-title">Total Pengeluaran (Filter)</span>
          <div className="stat-card-value text-rose">{formatRp(totalExpenseFiltered)}</div>
        </div>

        <div className="stat-card stat-card-gold" style={{ padding: "16px 20px" }}>
          <span className="stat-card-title">Arus Kas Bersih (Net Flow)</span>
          <div className="stat-card-value" style={{ color: netFiltered >= 0 ? "var(--emerald-dark)" : "var(--rose-dark)" }}>
            {formatRp(netFiltered)}
          </div>
        </div>
      </div>

      {/* Filter Bar Panel */}
      <div className="panel-card" style={{ padding: "16px 20px", marginBottom: "20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr 1fr 1fr 1fr", gap: "12px", alignItems: "center" }}>
          {/* Search Box */}
          <div className="input-prefix-wrap" style={{ width: "100%" }}>
            <span className="input-prefix" style={{ left: "10px" }}>
              <Search size={15} />
            </span>
            <input
              type="text"
              placeholder="Cari transaksi / keterangan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: "34px", height: "40px", fontSize: "13px" }}
            />
          </div>

          {/* Tipe Filter */}
          <div>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setFilterCategory("all");
              }}
              style={{ height: "40px", fontSize: "13px" }}
            >
              <option value="all">Semua Tipe</option>
              <option value="income">Pemasukan Saja</option>
              <option value="expense">Pengeluaran Saja</option>
            </select>
          </div>

          {/* Kategori Filter */}
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{ height: "40px", fontSize: "13px" }}
            >
              <option value="all">Semua Kategori</option>
              {allCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Rekening Filter */}
          <div>
            <select
              value={filterAccountId}
              onChange={(e) => setFilterAccountId(e.target.value)}
              style={{ height: "40px", fontSize: "13px" }}
            >
              <option value="all">Semua Rekening</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          {/* Rentang Tanggal */}
          <div>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              style={{ height: "40px", fontSize: "13px" }}
            >
              <option value="all">Sepanjang Waktu</option>
              <option value="thisMonth">Bulan Ini</option>
              <option value="thisYear">Tahun Ini</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabel Transaksi */}
      <div className="panel-card" style={{ padding: 0 }}>
        <div className="table-responsive">
          <table className="app-table">
            <thead>
              <tr>
                <th style={{ width: "110px" }}>Tanggal</th>
                <th style={{ width: "110px" }}>Tipe</th>
                <th>Keterangan / Catatan</th>
                <th>Kategori</th>
                <th>Rekening</th>
                <th style={{ textAlign: "right" }}>Nominal</th>
                <th style={{ width: "60px", textAlign: "center" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "36px", color: "var(--text-muted)" }}>
                    Tidak ada transaksi yang sesuai dengan kriteria filter saat ini.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td style={{ whiteSpace: "nowrap" }}>{formatDate(tx.date)}</td>
                    <td>
                      <span className={`badge badge-${tx.type === "income" ? "emerald" : "rose"} badge-sm`}>
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
                        onClick={() => {
                          if (confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
                            deleteTransaction(tx.id);
                          }
                        }}
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
