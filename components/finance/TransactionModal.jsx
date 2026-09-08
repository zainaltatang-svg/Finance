"use client";

import { useState } from "react";
import Modal from "../ui/Modal";
import { useFinance } from "../../context/FinanceContext";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "../../lib/constants";
import { todayISO } from "../../lib/formatters";

export default function TransactionModal({ isOpen, onClose, defaultType = "income" }) {
  const { accounts, addTransaction } = useFinance();

  const [type, setType] = useState(defaultType);
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(
    defaultType === "income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]
  );
  const [date, setDate] = useState(todayISO());
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const handleTypeChange = (newType) => {
    setType(newType);
    setCategory(newType === "income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!accountId) {
      setError("Pilih rekening bank atau kas terlebih dahulu.");
      return;
    }
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError("Masukkan jumlah nominal transaksi yang valid (lebih dari 0).");
      return;
    }

    addTransaction({
      type,
      accountId,
      amount: numAmount,
      category,
      date,
      notes: notes.trim(),
    });

    onClose();
  };

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={type === "income" ? "Catat Pemasukan Baru" : "Catat Pengeluaran Baru"}
    >
      <form onSubmit={handleSubmit} className="app-form">
        {/* Type Toggle Tabs */}
        <div className="type-toggle-row">
          <button
            type="button"
            className={`toggle-tab-btn ${type === "income" ? "active-income" : ""}`}
            onClick={() => handleTypeChange("income")}
          >
            Pemasukan (Uang Masuk)
          </button>
          <button
            type="button"
            className={`toggle-tab-btn ${type === "expense" ? "active-expense" : ""}`}
            onClick={() => handleTypeChange("expense")}
          >
            Pengeluaran (Uang Keluar)
          </button>
        </div>

        {error && <div className="form-alert-error">{error}</div>}

        <div className="form-group">
          <label htmlFor="tx-amount">Nominal (Rupiah) *</label>
          <div className="input-prefix-wrap">
            <span className="input-prefix">Rp</span>
            <input
              id="tx-amount"
              type="number"
              min="1"
              step="any"
              placeholder="Contoh: 1500000"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError("");
              }}
              required
              autoFocus
            />
          </div>
        </div>

        <div className="form-row-2">
          <div className="form-group">
            <label htmlFor="tx-account">Pilih Rekening *</label>
            <select
              id="tx-account"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              required
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.type})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="tx-category">Kategori Transaksi *</label>
            <select
              id="tx-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="tx-date">Tanggal Transaksi *</label>
          <input
            id="tx-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="tx-notes">Keterangan / Catatan Tambahan</label>
          <textarea
            id="tx-notes"
            rows="3"
            placeholder="Contoh: Pembayaran invoice dari Klien A, atau beli alat tulis kantor"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Batal
          </button>
          <button
            type="submit"
            className={type === "income" ? "btn-emerald" : "btn-rose"}
          >
            {type === "income" ? "Simpan Pemasukan" : "Simpan Pengeluaran"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
