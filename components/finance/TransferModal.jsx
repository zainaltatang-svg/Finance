"use client";

import { useState } from "react";
import Modal from "../ui/Modal";
import { useFinance } from "../../context/FinanceContext";
import { todayISO, formatRp } from "../../lib/formatters";

export default function TransferModal({ isOpen, onClose }) {
  const { accounts, accountBalances, addTransfer } = useFinance();

  const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id || "");
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id || "");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const fromBalanceObj = accountBalances.find((a) => a.id === fromAccountId);
  const fromBalance = fromBalanceObj?.currentBalance || 0;

  const handleSubmit = (e) => {
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

    addTransfer({
      fromAccountId,
      toAccountId,
      amount: numAmount,
      date,
      notes: notes.trim() || "Transfer antar rekening",
    });

    onClose();
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
              step="any"
              placeholder="Contoh: 1000000"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError("");
              }}
              required
              autoFocus
            />
          </div>
          {fromAccountId && (
            <span className="form-helper-text">
              Saldo saat ini di rekening asal: <strong>{formatRp(fromBalance)}</strong>
            </span>
          )}
        </div>

        <div className="form-row-2">
          <div className="form-group">
            <label htmlFor="tr-from">Dari Rekening (Sumber) *</label>
            <select
              id="tr-from"
              value={fromAccountId}
              onChange={(e) => {
                setFromAccountId(e.target.value);
                setError("");
              }}
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
            <label htmlFor="tr-to">Ke Rekening (Tujuan) *</label>
            <select
              id="tr-to"
              value={toAccountId}
              onChange={(e) => {
                setToAccountId(e.target.value);
                setError("");
              }}
              required
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id} disabled={acc.id === fromAccountId}>
                  {acc.name} ({acc.type}) {acc.id === fromAccountId ? "(Sama)" : ""}
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
          <button type="button" className="btn-secondary" onClick={onClose}>
            Batal
          </button>
          <button type="submit" className="btn-primary">
            Lakukan Transfer
          </button>
        </div>
      </form>
    </Modal>
  );
}
