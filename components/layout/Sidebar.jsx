"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Landmark,
  ArrowLeftRight,
  ShoppingCart,
  Package,
  Users2,
  FileBarChart2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

const NAV_GROUPS = [
  {
    title: "RINGKASAN",
    items: [
      { href: "/dashboard", label: "Dasbor Warung", icon: LayoutDashboard },
    ],
  },
  {
    title: "KASIR & STOK",
    items: [
      { href: "/dashboard/sales", label: "Kasir & Kasbon Warung", icon: ShoppingCart },
      { href: "/dashboard/inventory", label: "Barang & Stok Sembako", icon: Package },
    ],
  },
  {
    title: "KEUANGAN WARUNG",
    items: [
      { href: "/dashboard/accounts", label: "Kas Toko & Bank", icon: Landmark },
      { href: "/dashboard/transactions", label: "Mutasi & Kulakan", icon: ArrowLeftRight },
    ],
  },
  {
    title: "SDM & LAPORAN",
    items: [
      { href: "/dashboard/employees", label: "Penjaga Warung", icon: Users2 },
      { href: "/dashboard/reports", label: "Laporan Keuntungan", icon: FileBarChart2 },
    ],
  },
  {
    title: "SISTEM",
    items: [
      { href: "/dashboard/settings", label: "Pengaturan Warung", icon: Settings },
    ],
  },
];

export default function Sidebar({ isOpen, isCollapsed, toggleCollapse, closeMobile }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error("Error signing out:", err);
    } finally {
      // Pastikan cookie sesi auth terhapus
      if (typeof document !== "undefined") {
        document.cookie = "sb-access-token=; path=/; max-age=0; SameSite=Lax";
      }
      router.replace("/");
    }
  };

  const isActive = (href) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Backdrop untuk mobile */}
      {isOpen && <div className="sidebar-backdrop" onClick={closeMobile} />}

      <aside
        className={`app-sidebar ${isCollapsed ? "is-collapsed" : ""} ${isOpen ? "is-mobile-open" : ""}`}
      >
        {/* Brand Header */}
        <div className="sidebar-brand-box">
          <Link href="/dashboard" className="sidebar-brand" onClick={closeMobile}>
            <div className="brand-logo-icon">
              <Sparkles size={18} />
            </div>
            {!isCollapsed && (
              <div className="brand-text-wrap">
                <span className="brand-name">ZENTA</span>
                <span className="brand-badge">PRO</span>
              </div>
            )}
          </Link>

          {/* Tombol close di mobile */}
          <button
            type="button"
            className="mobile-close-btn"
            onClick={closeMobile}
            aria-label="Tutup menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="nav-group">
              {!isCollapsed && <div className="nav-group-header">{group.title}</div>}
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-link ${active ? "active" : ""}`}
                    onClick={closeMobile}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon size={18} className="nav-icon" />
                    {!isCollapsed && <span className="nav-label">{item.label}</span>}
                    {active && <span className="nav-indicator" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer Sidebar */}
        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={toggleCollapse}
            title={isCollapsed ? "Perluas Sidebar" : "Perkecil Sidebar"}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            {!isCollapsed && <span>Ciutkan Menu</span>}
          </button>

          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={handleLogout}
            title="Keluar dari ZENTA"
          >
            <LogOut size={16} />
            {!isCollapsed && <span>Keluar</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
