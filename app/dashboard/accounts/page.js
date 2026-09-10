"use client";

import { useState } from "react";
import { Plus, ArrowLeftRight, Trash2, Building2, Landmark, Wallet, Smartphone, CreditCard, Loader2 } from "lucide-react";
import { useFinance } from "../../../context/FinanceContext";
import { useToast } from "../../../components/ui/Toast";
import { useConfirm } from "../../../components/ui/ConfirmModal";
import { formatRp, formatDate } from "../../../lib/formatters";
import { ACCOUNT_TYPES } from "../../../lib/constants";
import Modal from "../../../components/ui/Modal";
import TransferModal from "../../../components/finance/TransferModal";

export default function AccountsPage() {
  const {
    accountBalances,
    transfers,
    addAccount,
    deleteAccount,
    deleteTransfer,
    getAccountName,
  } = useFinance();

  const toast = useToast();
  const { confirm } = useConfirm();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Form tambah akun
  const [name, setName] = useState("");
  const [type, setType] = useState("Bank");
  const [accountNumber, setAccountNumber] = useState("");
  const [initialBalance, setInitialBalance] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddAccount = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nama rekening atau kas wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await addAccount({
        name: name.trim(),
        type,
        accountNumber: accountNumber.trim() || "-",
        initialBalance: Number(initialBalance) || 0,
      });

      toast.success(`Rekening "${name.trim()}" berhasil ditambahkan!`);
      setName("");
      setAccountNumber("");
      setInitialBalance("");
      setError("");
      setShowAddModal(false);
    } catch (err) {
      console.error(err);
      setError("Gagal menambahkan rekening. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAccountIcon = (accType) => {
    switch (accType) {
      case "Bank": return Landmark;
      case "Giro": return Building2;
      case "E-Wallet": return Smartphone;
      case "Kartu Kredit": return CreditCard;
      default: return Wallet;
    }
  };

  return (
    <div className="accounts-page">
      {/* Top Header */}
      <div className="page-header-flex">
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 700 }}>Kas Toko &amp; Rekening Bank</h2>
          <p style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
            Kelola uang tunai di laci kasir, QRIS warung, dan rekening bank kulakan sembako.
          </p>
        </div>

        <div className="page-header-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowTransferModal(true)}
            disabled={accountBalances.length < 2}
            title={accountBalances.length < 2 ? "Butuh minimal 2 rekening" : "Pindah Kas / Tarik Tunai"}
          >
            <ArrowLeftRight size={16} /> Tarik Tunai / Pindah Kas
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} /> + Tambah Kas / Rekening
          </button>
        </div>
      </div>

      {/* Grid Rekening Cards */}
      <div className="stats-grid-3" style={{ marginBottom: "28px" }}>
        {accountBalances.map((acc) => {
          const IconComponent = getAccountIcon(acc.type);
          return (
            <div key={acc.id} className="stat-card stat-card-emerald" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div className="stat-card-icon-wrap" style={{ backgroundColor: "var(--emerald-soft)", color: "var(--emerald-primary)" }}>
                    <IconComponent size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "15px", fontWeight: 700 }}>{acc.name}</h3>
                    <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                      {acc.type} {acc.accountNumber !== "-" ? `(${acc.accountNumber})` : ""}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="icon-del-btn"
                  onClick={async () => {
                    const ok = await confirm({
                      title: "Hapus Rekening",
                      message: `Hapus rekening "${acc.name}" beserta seluruh riwayat mutasi terkait?`,
                      confirmText: "Hapus Rekening",
                      cancelText: "Batal",
                      danger: true,
                    });
                    if (ok) {
                      try {
                        await deleteAccount(acc.id);
                        toast.success(`Rekening "${acc.name}" berhasil dihapus.`);
                      } catch (err) {
                        console.error(err);
                        toast.error(err.message || `Gagal menghapus rekening "${acc.name}".`);
                      }
                    }
                  }}
                  title="Hapus Rekening"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div style={{ margin: "14px 0 10px" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)" }}>
                  Saldo Berjalan Saat Ini
                </span>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>
                  {formatRp(acc.currentBalance)}
                </div>
              </div>

              <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "10px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "11.5px" }}>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Saldo Awal:</span>{" "}
                  <strong style={{ fontFamily: "var(--font-mono)" }}>{formatRp(acc.initialBalance)}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Pemasukan:</span>{" "}
                  <strong style={{ fontFamily: "var(--font-mono)", color: "var(--emerald-dark)" }}>+ {formatRp(acc.totalIncome)}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Pengeluaran:</span>{" "}
                  <strong style={{ fontFamily: "var(--font-mono)", color: "var(--rose-dark)" }}>- {formatRp(acc.totalExpense)}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Net Transfer:</span>{" "}
                  <strong style={{ fontFamily: "var(--font-mono)" }}>
                    {formatRp((acc.transferIn || 0) - (acc.transferOut || 0))}
                  </strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Riwayat Mutasi Transfer Antar Rekening */}
      <div className="panel-card">
        <div className="panel-header">
          <div>
            <h3 className="panel-title">Riwayat Mutasi Transfer Antar Rekening</h3>
            <p className="panel-subtitle">Pemindahan dana internal antar akun bisnis</p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="app-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Dari Rekening (Asal)</th>
                <th>Ke Rekening (Tujuan)</th>
                <th>Nominal Transfer</th>
                <th>Keterangan</th>
                <th style={{ width: "50px" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "28px", color: "var(--text-muted)" }}>
                    Belum ada riwayat transfer internal antar rekening.
                  </td>
                </tr>
              ) : (
                transfers.map((tr) => (
                  <tr key={tr.id}>
                    <td style={{ whiteSpace: "nowrap" }}>{formatDate(tr.date)}</td>
                    <td>
                      <span className="badge badge-rose badge-sm">
                        {getAccountName(tr.fromAccountId)}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-emerald badge-sm">
                        {getAccountName(tr.toAccountId)}
                      </span>
                    </td>
                    <td className="num-cell" style={{ color: "var(--blue-dark)", fontWeight: 700 }}>
                      {formatRp(tr.amount)}
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>{tr.notes || "-"}</td>
                    <td>
                      <button
                        type="button"
                        className="icon-del-btn"
                        onClick={async () => {
                          const ok = await confirm({
                            title: "Batalkan Transfer",
                            message: `Hapus catatan mutasi transfer sebesar ${formatRp(tr.amount)}?`,
                            confirmText: "Ya, Batalkan",
                            cancelText: "Batal",
                            danger: true,
                          });
                          if (ok) {
                            deleteTransfer(tr.id);
                            toast.info("Catatan transfer internal dihapus.");
                          }
                        }}
                        title="Batalkan transfer"
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

      {/* Modal Tambah Rekening */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Tambah Rekening Kas atau Bank"
      >
        <form onSubmit={handleAddAccount} className="app-form">
          {error && <div className="form-alert-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="acc-name">Nama Rekening / Akun *</label>
            <input
              id="acc-name"
              type="text"
              placeholder="Contoh: Bank Mandiri Giro Bisnis"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              required
              autoFocus
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="acc-type">Jenis Akun *</label>
              <select
                id="acc-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
              >
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="acc-num">Nomor Rekening / Kartu</label>
              <input
                id="acc-num"
                type="text"
                placeholder="Contoh: 124-00-192837-1"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="acc-init">Saldo Awal (Rupiah)</label>
            <div className="input-prefix-wrap">
              <span className="input-prefix">Rp</span>
              <input
                id="acc-init"
                type="number"
                min="0"
                placeholder="0"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowAddModal(false)}
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                "Simpan Rekening"
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Transfer Modal */}
      {showTransferModal && (
        <TransferModal
          isOpen={true}
          onClose={() => setShowTransferModal(false)}
        />
      )}
    </div>
  );
}
