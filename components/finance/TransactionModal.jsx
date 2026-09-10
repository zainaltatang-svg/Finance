"use client";

import { useState } from "react";
import Modal from "../ui/Modal";
import { useFinance } from "../../context/FinanceContext";
import { useToast } from "../ui/Toast";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "../../lib/constants";
import { todayISO } from "../../lib/formatters";
import { Loader2 } from "lucide-react";

export default function TransactionModal({ isOpen, onClose, defaultType = "income" }) {
  const { accounts, addTransaction } = useFinance();
  const toast = useToast();

  const [type, setType] = useState(defaultType);
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(
    defaultType === "income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]
  );
  const [date, setDate] = useState(todayISO());
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTypeChange = (newType) => {
    setType(newType);
    setCategory(newType === "income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
  };

  const handleSubmit = async (e) => {
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

    setIsSubmitting(true);
    setError("");
    try {
      await addTransaction({
        type,
        accountId,
        amount: numAmount,
        category,
        date,
        notes: notes.trim(),
      });

      toast.success(type === "income" ? "Transaksi pemasukan berhasil dicatat!" : "Transaksi pengeluaran berhasil dicatat!");
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || "Gagal menyimpan transaksi ke cloud.");
    } finally {
      setIsSubmitting(false);
    }
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
        <div className="tab-pills" style={{ marginBottom: "16px" }}>
          <button
            type="button"
            className={`tab-pill ${type === "income" ? "active active-emerald" : ""}`}
            onClick={() => handleTypeChange("income")}
          >
            Pemasukan (Income)
          </button>
          <button
            type="button"
            className={`tab-pill ${type === "expense" ? "active active-rose" : ""}`}
            onClick={() => handleTypeChange("expense")}
          >
            Pengeluaran (Expense)
          </button>
        </div>

        {error && (
          <div className="form-error-banner" style={{ marginBottom: "14px" }}>
            {error}
          </div>
        )}

        <div className="form-row-2">
          <div className="form-group">
            <label htmlFor="tx-account">Rekening Kas/Bank *</label>
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
          <label htmlFor="tx-amount">Nominal (Rupiah) *</label>
          <div className="input-prefix-wrap">
            <span className="input-prefix">Rp</span>
            <input
              id="tx-amount"
              type="number"
              min="1"
              placeholder="Contoh: 1500000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
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
          <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
            Batal
          </button>
          <button
            type="submit"
            className={type === "income" ? "btn-emerald" : "btn-rose"}
            disabled={isSubmitting}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            {isSubmitting && <Loader2 className="animate-spin" size={15} />}
            {isSubmitting
              ? "Menyimpan..."
              : type === "income"
              ? "Simpan Pemasukan"
              : "Simpan Pengeluaran"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
