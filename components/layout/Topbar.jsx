"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, Plus, ArrowLeftRight, FileText, ChevronDown } from "lucide-react";
import { useFinance } from "../../context/FinanceContext";
import TransactionModal from "../finance/TransactionModal";
import TransferModal from "../finance/TransferModal";
import InvoiceModal from "../sales/InvoiceModal";

const ROUTE_TITLES = {
  "/dashboard": { title: "Dasbor Utama", desc: "Ringkasan metrik finansial, arus kas, dan operasional bisnis" },
  "/dashboard/accounts": { title: "Rekening Bank & Kas", desc: "Kelola kas tunai, rekening giro, bank, dan mutasi saldo" },
  "/dashboard/transactions": { title: "Mutasi Transaksi", desc: "Pencatatan uang masuk, keluar, filter, dan ekspor data" },
  "/dashboard/sales": { title: "Penjualan & Invoice", desc: "Kelola order pesanan klien, status tagihan, dan cetak invoice" },
  "/dashboard/inventory": { title: "Inventori Produk", desc: "Manajemen katalog stok barang, SKU, harga beli vs jual, dan valuasi aset" },
  "/dashboard/employees": { title: "Karyawan & Payroll", desc: "Database staf, absensi harian, dan slip gaji terintegrasi" },
  "/dashboard/reports": { title: "Laporan Keuangan", desc: "Laporan Laba Rugi (P&L), ringkasan arus kas, dan rasio keuangan" },
  "/dashboard/settings": { title: "Pengaturan & Backup", desc: "Pengaturan profil bisnis, backup/restore data JSON, dan integrasi cloud" },
};

export default function Topbar({ openMobile }) {
  const pathname = usePathname();
  const { profile, user } = useFinance();

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
