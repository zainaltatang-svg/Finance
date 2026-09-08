"use client";

import { useState } from "react";
import { Download, Upload, RotateCcw, Database, ShieldCheck, Check, Building } from "lucide-react";
import { useFinance } from "../../../context/FinanceContext";

export default function SettingsPage() {
  const {
    profile,
    updateProfile,
    exportJSON,
    importJSON,
    resetAllData,
  } = useFinance();

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

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    updateProfile(form);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleFileImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        importJSON(json);
        alert("Data berhasil dipulihkan dari berkas cadangan JSON!");
        setImportError("");
      } catch (err) {
        setImportError("Berkas JSON rusak atau format tidak valid.");
      }
    };
    reader.readAsText(file);
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

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "24px" }}>
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
              <button type="submit" className="btn-primary">
                Simpan Perubahan Profil
              </button>
            </div>
          </form>
        </div>

        {/* Section 2: Backup & Supabase */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
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
                onClick={exportJSON}
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
                onClick={() => {
                  if (confirm("Reset ulang data ke contoh default ZENTA? Seluruh perubahan saat ini akan diganti.")) {
                    resetAllData();
                    alert("Data telah di-reset ke pengaturan awal.");
                  }
                }}
                style={{ textAlign: "left", paddingLeft: 0 }}
              >
                <RotateCcw size={14} /> Reset ke Contoh Data Awal
              </button>
            </div>
          </div>

          {/* Integrasi Cloud Supabase */}
          <div className="panel-card" style={{ marginBottom: 0, backgroundColor: "var(--bg-panel-subtle)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <Database size={20} color="var(--emerald-primary)" />
              <h3 style={{ fontSize: "14.5px", fontWeight: 700 }}>Integrasi Cloud Supabase</h3>
            </div>

            <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "14px" }}>
              Aplikasi ini telah terhubung ke Supabase Auth. Untuk mengaktifkan sinkronisasi multi-device &amp; multi-user penuh, jalankan skrip SQL di file <code>supabase/schema.sql</code> melalui <strong>Supabase SQL Editor</strong>.
            </p>

            <div style={{ fontSize: "11px", backgroundColor: "#ffffff", padding: "10px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              Skema file: supabase/schema.sql (Lengkap dengan RLS)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
