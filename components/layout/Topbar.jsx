"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, Plus, ArrowLeftRight, FileText, ChevronDown, RefreshCw, CloudOff } from "lucide-react";
import { useFinance } from "../../context/FinanceContext";
import { useToast } from "../ui/Toast";
import TransactionModal from "../finance/TransactionModal";
import TransferModal from "../finance/TransferModal";
import InvoiceModal from "../sales/InvoiceModal";

const ROUTE_TITLES = {
  "/dashboard": { title: "Dasbor Warung", desc: "Ringkasan omset harian, kas laci toko, kasbon warga, dan barang perlu kulakan" },
  "/dashboard/accounts": { title: "Kas Toko & Bank", desc: "Kelola kas laci uang tunai, QRIS warung, dan rekening bank kulakan" },
  "/dashboard/transactions": { title: "Mutasi & Kulakan", desc: "Pencatatan arus kas warung, belanja kulakan pasar/agen, dan operasional" },
  "/dashboard/sales": { title: "Kasir & Kasbon Warung", desc: "Transaksi kasir eceran, buku kasbon warga, dan cetak struk thermal" },
  "/dashboard/inventory": { title: "Barang & Stok Sembako", desc: "Katalog stok sembako warung, peringatan barang menipis, dan margin laba" },
  "/dashboard/employees": { title: "Penjaga Warung", desc: "Jadwal shift jaga warung, absensi harian, dan gaji/uang makan" },
  "/dashboard/reports": { title: "Laporan Keuntungan", desc: "Laporan Laba Rugi warung, keuntungan kulakan harian, dan arus kas" },
  "/dashboard/settings": { title: "Pengaturan Warung", desc: "Profil warung kelontong, backup/restore data, dan sinkronisasi" },
};

export default function Topbar({ openMobile }) {
  const pathname = usePathname();
  const { profile, user, isSyncing, refreshCloudData } = useFinance();
  const toast = useToast();

  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [modalType, setModalType] = useState(null); // 'income', 'expense', 'transfer', 'invoice'

  const currentRoute = ROUTE_TITLES[pathname] || {
    title: "ZENTA Finance",
    desc: "Workspace Manajemen Bisnis",
  };

  return (
    <>
      <header className="app-topbar">
        <div className="topbar-left">
          <button
            type="button"
            className="mobile-hamburger-btn"
            onClick={openMobile}
            aria-label="Buka menu navigasi"
          >
            <Menu size={20} />
          </button>

          <div className="topbar-title-block">
            <h1 className="topbar-page-title">{currentRoute.title}</h1>
            <p className="topbar-page-desc">{currentRoute.desc}</p>
          </div>
        </div>

        <div className="topbar-right">
          {/* Quick Action Dropdown */}
          <div className="quick-action-dropdown-wrap">
            <button
              type="button"
              className="quick-action-btn"
              onClick={() => setShowQuickMenu((prev) => !prev)}
            >
              <Plus size={16} />
              <span>Aksi Cepat</span>
              <ChevronDown size={14} className={showQuickMenu ? "rotate-180" : ""} />
            </button>

            {showQuickMenu && (
              <>
                <div
                  className="dropdown-backdrop"
                  onClick={() => setShowQuickMenu(false)}
                />
                <div className="quick-action-dropdown-menu">
                  <button
                    type="button"
                    className="dropdown-action-item text-emerald"
                    onClick={() => {
                      setShowQuickMenu(false);
                      setModalType("income");
                    }}
                  >
                    <Plus size={16} />
                    <span>Catat Pemasukan</span>
                  </button>

                  <button
                    type="button"
                    className="dropdown-action-item text-rose"
                    onClick={() => {
                      setShowQuickMenu(false);
                      setModalType("expense");
                    }}
                  >
                    <Plus size={16} />
                    <span>Catat Pengeluaran</span>
                  </button>

                  <button
                    type="button"
                    className="dropdown-action-item text-blue"
                    onClick={() => {
                      setShowQuickMenu(false);
                      setModalType("transfer");
                    }}
                  >
                    <ArrowLeftRight size={16} />
                    <span>Transfer Antar Rekening</span>
                  </button>

                  <div className="dropdown-divider" />

                  <button
                    type="button"
                    className="dropdown-action-item"
                    onClick={() => {
                      setShowQuickMenu(false);
                      setModalType("invoice");
                    }}
                  >
                    <FileText size={16} />
                    <span>Buat Invoice Pesanan</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Cloud Sync Status Indicator */}
          <div className="cloud-status-indicator">
            {isSyncing ? (
              <span className="cloud-badge cloud-syncing" title="Sedang menyinkronkan data dengan Supabase...">
                <RefreshCw size={13} className="animate-spin" />
                <span className="cloud-badge-text">Menyinkronkan...</span>
              </span>
            ) : user ? (
              <button
                type="button"
                className="cloud-badge cloud-online"
                onClick={async () => {
                  try {
                    await refreshCloudData();
                    toast.success("Data berhasil disinkronkan dari database Supabase.");
                  } catch {
                    toast.error("Gagal menyinkronkan data cloud.");
                  }
                }}
                title="Cloud Terhubung (Klik untuk menyegarkan data)"
              >
                <span className="online-dot" />
                <span className="cloud-badge-text">Cloud Aktif</span>
                <RefreshCw size={11} className="refresh-icon-subtle" />
              </button>
            ) : (
              <span className="cloud-badge cloud-offline" title="Mode Offline / Penyimpanan Lokal">
                <CloudOff size={13} />
                <span className="cloud-badge-text">Lokal</span>
              </span>
            )}
          </div>

          {/* User Profile Pill */}
          <div className="user-profile-pill">
            <div className="user-avatar-initials">
              {profile?.name ? profile.name.slice(0, 2).toUpperCase() : "ZT"}
            </div>
            <div className="user-info-text">
              <span className="user-business-name">{profile?.name || "ZENTA"}</span>
              <span className="user-email-tag">{user?.email || "Offline / Lokal"}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Global Quick Action Modals */}
      {modalType === "income" && (
        <TransactionModal
          isOpen={true}
          defaultType="income"
          onClose={() => setModalType(null)}
        />
      )}

      {modalType === "expense" && (
        <TransactionModal
          isOpen={true}
          defaultType="expense"
          onClose={() => setModalType(null)}
        />
      )}

      {modalType === "transfer" && (
        <TransferModal
          isOpen={true}
          onClose={() => setModalType(null)}
        />
      )}

      {modalType === "invoice" && (
        <InvoiceModal
          isOpen={true}
          onClose={() => setModalType(null)}
        />
      )}
    </>
  );
}
