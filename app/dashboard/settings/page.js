"use client";

import { useState } from "react";
import { Download, Upload, RotateCcw, Database, ShieldCheck, Check, Building, CloudUpload, Loader2, RefreshCw } from "lucide-react";
import { useFinance } from "../../../context/FinanceContext";
import { useToast } from "../../../components/ui/Toast";
import { useConfirm } from "../../../components/ui/ConfirmModal";
import { migrationService } from "../../../lib/services/migrationService";

export default function SettingsPage() {
  const {
    profile,
    updateProfile,
    exportJSON,
    importJSON,
    resetAllData,
    user,
    refreshCloudData,
    seedCloudData,
    isSyncing,
  } = useFinance();

  const toast = useToast();
  const [isSeeding, setIsSeeding] = useState(false);
  const { confirm } = useConfirm();

  const [form, setForm] = useState({
    name: profile?.name || "ZENTA Business",
    tagline: profile?.tagline || "Solusi Manajemen Bisnis Terintegrasi",
    address: profile?.address || "Jl. Sudirman No. 128, Jakarta Pusat",
    phone: profile?.phone || "+62 812-3456-7890",
    email: profile?.email || "finance@zentabusiness.id",
    currency: profile?.currency || "IDR",
  });

  const [savedNotice, setSavedNotice] = useState(false);
  const [importError, setImportError] = useState("");
  const [migrating, setMigrating] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await updateProfile(form);
      setSavedNotice(true);
      toast.success("Profil perusahaan berhasil diperbarui!");
      setTimeout(() => setSavedNotice(false), 3000);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Gagal menyimpan perubahan profil ke cloud.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleFileImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        importJSON(json);
        toast.success("Data berhasil dipulihkan dari berkas cadangan JSON!");
        setImportError("");
      } catch {
        setImportError("Berkas JSON rusak atau format tidak valid.");
        toast.error("Gagal membaca berkas JSON. Format tidak valid.");
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = async () => {
    const isConfirmed = await confirm({
      title: "Reset ke Contoh Data Awal",
      message: "Reset ulang seluruh data ke contoh default ZENTA? Data transaksi dan perubahan saat ini akan diganti.",
      confirmText: "Ya, Reset Data",
      cancelText: "Batal",
      danger: true,
    });

    if (isConfirmed) {
      resetAllData();
      toast.info("Data telah di-reset ke pengaturan awal ZENTA.");
    }
  };

  const handleCloudSync = async () => {
    if (!user) {
      toast.warning("Silakan masuk terlebih dahulu untuk menyinkronkan data ke cloud.");
      return;
    }

    const isConfirmed = await confirm({
      title: "Sinkronkan Data Lokal ke Cloud",
      message: "Seluruh data bisnis lokal (rekening, transaksi, produk, klien, karyawan) akan diunggah ke database cloud Supabase akun Anda.",
      confirmText: "Mulai Sinkronisasi",
      cancelText: "Batal",
      danger: false,
    });

    if (!isConfirmed) return;

    setMigrating(true);
    try {
      const summary = await migrationService.migrateLocalDataToCloud(user.id);
      await refreshCloudData();
      toast.success(
        `Sinkronisasi cloud tuntas! Berhasil menyimpan ${summary.accounts} rekening, ${summary.transactions} transaksi, ${summary.products} produk, dan ${summary.employees} karyawan.`
      );
    } catch (err) {
      console.error("Gagal sinkronisasi cloud:", err);
      toast.error(`Gagal menyinkronkan data ke cloud: ${err.message}`);
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="settings-page">
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700 }}>Pengaturan &amp; Cadangan Sistem</h2>
        <p style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
          Kustomisasi identitas profil perusahaan, cadangkan data bisnis, dan integrasi cloud database.
        </p>
      </div>

      <div className="settings-layout-grid">
        {/* Section 1: Profil Bisnis */}
        <div className="panel-card">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Profil &amp; Identitas Usaha</h3>
              <p className="panel-subtitle">Informasi ini akan tercetak otomatis di Invoice dan Slip Gaji</p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="app-form">
            {savedNotice && (
              <div style={{ padding: "10px 14px", backgroundColor: "var(--emerald-soft)", color: "var(--emerald-dark)", border: "1px solid var(--emerald-border)", borderRadius: "var(--radius-md)", fontSize: "12.5px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Check size={16} /> Profil usaha berhasil diperbarui!
              </div>
            )}

            <div className="form-group">
              <label htmlFor="set-name">Nama Perusahaan / Bisnis *</label>
              <input
                id="set-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="set-tagline">Slogan / Tagline Bisnis</label>
              <input
                id="set-tagline"
                type="text"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="set-phone">Nomor Telepon Kantor</label>
                <input
                  id="set-phone"
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="set-email">Email Bisnis</label>
                <input
                  id="set-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="set-address">Alamat Kantor / Operasional</label>
              <textarea
                id="set-address"
                rows="2"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                className="btn-primary"
                disabled={isSavingProfile}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                {isSavingProfile && <Loader2 className="animate-spin" size={14} />}
                {isSavingProfile ? "Menyimpan..." : "Simpan Perubahan Profil"}
              </button>
            </div>
          </form>
        </div>

        {/* Section 2: Backup & Supabase */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Integrasi Cloud Supabase */}
          <div className="panel-card" style={{ marginBottom: 0, border: "1px solid var(--emerald-border)", backgroundColor: "var(--bg-panel)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "34px", height: "34px", borderRadius: "8px", backgroundColor: "var(--emerald-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Database size={18} color="var(--emerald-primary)" />
                </div>
                <div>
                  <h3 style={{ fontSize: "14.5px", fontWeight: 700, margin: 0 }}>Sinkronisasi Cloud Database</h3>
                  <span style={{ fontSize: "11px", color: user ? "var(--emerald-dark)" : "var(--text-muted)", fontWeight: 500 }}>
                    {user ? `Terhubung: ${user.email}` : "Mode Offline / Belum Terhubung"}
                  </span>
                </div>
              </div>
              {isSyncing && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11.5px", color: "var(--emerald-dark)" }}>
                  <Loader2 className="animate-spin" size={14} /> Sinkron...
                </div>
              )}
            </div>

            <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "14px" }}>
              Simpan dan sinkronkan seluruh rekening, transaksi, klien, produk, dan karyawan dari browser lokal Anda ke database cloud Supabase agar dapat diakses dari perangkat manapun.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                type="button"
                className="btn-primary"
                onClick={handleCloudSync}
                disabled={migrating || isSyncing}
                style={{ width: "100%", justifyContent: "center" }}
              >
                {migrating ? (
                  <>
                    <Loader2 className="animate-spin" size={16} /> Menyinkronkan ke Cloud...
                  </>
                ) : (
                  <>
                    <CloudUpload size={16} /> Sinkronkan Data Lokal ke Cloud
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={async () => {
                  try {
                    await refreshCloudData();
                    toast.success("Data berhasil disinkronkan dari database Supabase.");
                  } catch {
                    toast.error("Gagal menyinkronkan data cloud.");
                  }
                }}
                disabled={isSyncing || migrating || isSeeding}
                style={{ width: "100%", justifyContent: "center" }}
              >
                <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} /> Muat Ulang Data Cloud
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={async () => {
                  const ok = await confirm({
                    title: "Isi Template Data Contoh ke Cloud",
                    message: "Data contoh standar (rekening Kas, Bank, produk, dan karyawan) akan disuntikkan langsung ke database cloud akun Anda.",
                    confirmText: "Muat Data Contoh",
                    cancelText: "Batal",
                  });
                  if (!ok) return;
                  setIsSeeding(true);
                  try {
                    await seedCloudData();
                    toast.success("Data contoh bisnis berhasil dimuat ke database Supabase Cloud!");
                  } catch (err) {
                    toast.error("Gagal mengisi template: " + (err.message || ""));
                  } finally {
                    setIsSeeding(false);
                  }
                }}
                disabled={isSyncing || migrating || isSeeding}
                style={{ width: "100%", justifyContent: "center" }}
              >
                {isSeeding ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Mengisi Template...
                  </>
                ) : (
                  <>
                    <Database size={14} /> Isi Template Data Contoh ke Cloud
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Cadangan Data JSON */}
          <div className="panel-card" style={{ marginBottom: 0 }}>
            <div className="panel-header">
              <div>
                <h3 className="panel-title">Cadangan &amp; Pemulihan Data</h3>
                <p className="panel-subtitle">Ekspor dan impor seluruh data transaksi dan inventori</p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  exportJSON();
                  toast.success("Berkas cadangan JSON berhasil diunduh.");
                }}
                style={{ justifyContent: "flex-start", width: "100%" }}
              >
                <Download size={16} /> Ekspor Seluruh Data ke JSON
              </button>

              <label
                className="btn-secondary"
                style={{ justifyContent: "flex-start", width: "100%", cursor: "pointer" }}
              >
                <Upload size={16} /> Impor &amp; Pulihkan dari Berkas JSON
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  style={{ display: "none" }}
                />
              </label>

              {importError && (
                <span style={{ fontSize: "11.5px", color: "var(--rose-primary)" }}>
                  {importError}
                </span>
              )}

              <hr style={{ border: 0, height: 1, backgroundColor: "var(--border-subtle)", margin: "8px 0" }} />

              <button
                type="button"
                className="btn-text-action text-rose"
                onClick={handleResetData}
                style={{ textAlign: "left", paddingLeft: 0 }}
              >
                <RotateCcw size={14} /> Reset ke Contoh Data Awal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
