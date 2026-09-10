"use client";

import { useState } from "react";
import Modal from "../ui/Modal";
import { useFinance } from "../../context/FinanceContext";
import { useToast } from "../ui/Toast";
import { todayISO, formatRp } from "../../lib/formatters";
import { Loader2 } from "lucide-react";

export default function TransferModal({ isOpen, onClose }) {
  const { accounts, accountBalances, addTransfer } = useFinance();
  const toast = useToast();

  const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id || "");
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id || "");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fromBalanceObj = accountBalances.find((a) => a.id === fromAccountId);
  const fromBalance = fromBalanceObj?.currentBalance || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fromAccountId || !toAccountId) {
      setError("Pilih rekening sumber dan rekening tujuan.");
      return;
    }
    if (fromAccountId === toAccountId) {
      setError("Rekening asal dan rekening tujuan tidak boleh sama.");
      return;
    }
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError("Masukkan nominal transfer yang valid (lebih dari 0).");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      await addTransfer({
        fromAccountId,
        toAccountId,
        amount: numAmount,
        date,
        notes: notes.trim() || "Transfer antar rekening",
      });

      toast.success(`Transfer sebesar ${formatRp(numAmount)} berhasil diproses!`);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || "Gagal memproses transfer ke cloud.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Transfer Antar Rekening">
      <form onSubmit={handleSubmit} className="app-form">
        {error && <div className="form-alert-error">{error}</div>}

        <div className="form-group">
          <label htmlFor="tr-amount">Nominal Transfer *</label>
          <div className="input-prefix-wrap">
            <span className="input-prefix">Rp</span>
            <input
              id="tr-amount"
              type="number"
              min="1"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-row-2">
          <div className="form-group">
            <label htmlFor="tr-from">Dari Rekening (Asal) *</label>
            <select
              id="tr-from"
              value={fromAccountId}
              onChange={(e) => setFromAccountId(e.target.value)}
              required
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
              Saldo saat ini: <strong>{formatRp(fromBalance)}</strong>
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="tr-to">Ke Rekening (Tujuan) *</label>
            <select
              id="tr-to"
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}
              required
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="tr-date">Tanggal Transfer *</label>
          <input
            id="tr-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="tr-notes">Keterangan / Catatan Transfer</label>
          <input
            id="tr-notes"
            type="text"
            placeholder="Contoh: Tarik tunai ke kas kecil, atau pindah dana tabungan"
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
            className="btn-primary"
            disabled={isSubmitting}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            {isSubmitting && <Loader2 className="animate-spin" size={15} />}
            {isSubmitting ? "Memproses..." : "Lakukan Transfer"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
