"use client";

import { useState } from "react";
import { Plus, AlertTriangle, Package, Briefcase, Edit2, Trash2, Layers, CheckCircle2 } from "lucide-react";
import { useFinance } from "../../../context/FinanceContext";
import { useToast } from "../../../components/ui/Toast";
import { useConfirm } from "../../../components/ui/ConfirmModal";
import { formatRp } from "../../../lib/formatters";
import Badge from "../../../components/ui/Badge";
import ProductModal from "../../../components/inventory/ProductModal";

export default function InventoryPage() {
  const {
    products,
    inventoryValuation,
    deleteProduct,
    adjustStock,
  } = useFinance();

  const toast = useToast();
  const { confirm } = useConfirm();

  const [showProductModal, setShowProductModal] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'product' | 'service' | 'low_stock'

  // Filter Data
  const physicalProducts = products.filter((p) => p.type !== "service");
  const serviceProducts = products.filter((p) => p.type === "service");
  const lowStockProducts = physicalProducts.filter((p) => Number(p.stock || 0) <= Number(p.minStock || 5));

  const displayedItems = (() => {
    switch (activeTab) {
      case "product":
        return physicalProducts;
      case "service":
        return serviceProducts;
      case "low_stock":
        return lowStockProducts;
      case "all":
      default:
        return products;
    }
  })();

  // Hitung KPI khusus Jasa jika di tab Jasa
  const avgServiceRate = serviceProducts.length > 0
    ? Math.round(serviceProducts.reduce((sum, s) => sum + (Number(s.price) || 0), 0) / serviceProducts.length)
    : 0;

  const handleOpenAddModal = (defaultType = "product") => {
    setProductToEdit({ type: defaultType });
    setShowProductModal(true);
  };

  return (
    <div className="inventory-page">
      {/* Top Header */}
      <div className="page-header-flex">
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 700 }}>Barang Dagangan &amp; Stok Sembako</h2>
          <p style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
            Kelola stok barang dagangan warung, pantau barang yang menipis (perlu kulakan ke pasar/agen), dan harga jual eceran.
          </p>
        </div>

        <div className="page-header-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={() => handleOpenAddModal("product")}
          >
            <Plus size={16} /> + Tambah Barang Dagangan
          </button>
        </div>
      </div>

      {/* KPI Cards Dinamis Warung */}
      <div className="stats-grid-4" style={{ marginBottom: "24px" }}>
        <div className="stat-card stat-card-gold" style={{ padding: "16px 20px" }}>
          <span className="stat-card-title">Modal Kulakan Tertanam</span>
          <div className="stat-card-value">{formatRp(inventoryValuation.totalCostValuation)}</div>
          <span className="stat-card-sub">Total modal beli seluruh stok</span>
        </div>

        <div className="stat-card stat-card-emerald" style={{ padding: "16px 20px" }}>
          <span className="stat-card-title">Potensi Omset Penjualan</span>
          <div className="stat-card-value text-emerald">{formatRp(inventoryValuation.totalRetailValuation)}</div>
          <span className="stat-card-sub">Jika seluruh stok laku terjual</span>
        </div>

        <div className="stat-card stat-card-blue" style={{ padding: "16px 20px" }}>
          <span className="stat-card-title">Estimasi Margin Laba</span>
          <div className="stat-card-value text-blue">{formatRp(inventoryValuation.potentialProfit)}</div>
          <span className="stat-card-sub">Selisih harga jual vs modal</span>
        </div>

        <div className={`stat-card ${lowStockProducts.length > 0 ? "stat-card-rose" : ""}`} style={{ padding: "16px 20px" }}>
          <span className="stat-card-title">Perlu Segera Kulakan</span>
          <div className="stat-card-value" style={{ color: lowStockProducts.length > 0 ? "var(--rose-primary)" : "var(--emerald-dark)" }}>
            {lowStockProducts.length} Barang
          </div>
          <span className="stat-card-sub">
            {lowStockProducts.length > 0 ? "Stok di bawah batas minimum" : "Semua stok barang aman"}
          </span>
        </div>
      </div>

      {/* Tab Navigasi Filter */}
      <div style={{ marginBottom: "16px" }}>
        <div className="scrollable-tabs-bar">
          <button
            type="button"
            className={`btn-secondary btn-sm ${activeTab === "all" ? "btn-primary" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            Semua Barang ({products.length})
          </button>
          <button
            type="button"
            className={`btn-secondary btn-sm ${activeTab === "low_stock" ? "btn-primary" : ""}`}
            onClick={() => setActiveTab("low_stock")}
            style={
              activeTab === "low_stock"
                ? { backgroundColor: "var(--rose-primary)", borderColor: "var(--rose-primary)", color: "#fff" }
                : lowStockProducts.length > 0
                ? { color: "var(--rose-primary)", borderColor: "var(--rose-border)" }
                : {}
            }
          >
            <AlertTriangle size={14} /> Perlu Kulakan ({lowStockProducts.length})
          </button>
          <button
            type="button"
            className={`btn-secondary btn-sm ${activeTab === "product" ? "btn-primary" : ""}`}
            onClick={() => setActiveTab("product")}
          >
            <Package size={14} /> Barang Fisik ({physicalProducts.length})
          </button>
          {serviceProducts.length > 0 && (
            <button
              type="button"
              className={`btn-secondary btn-sm ${activeTab === "service" ? "btn-primary" : ""}`}
              onClick={() => setActiveTab("service")}
            >
              <Briefcase size={14} /> Jasa &amp; Titipan ({serviceProducts.length})
            </button>
          )}
        </div>
      </div>

      {/* Tabel Katalog */}
      <div className="panel-card" style={{ padding: 0 }}>
        <div className="table-responsive">
          <table className="app-table">
            <thead>
              <tr>
                <th>Nama Item &amp; Kode/SKU</th>
                <th style={{ textAlign: "center" }}>Tipe</th>
                <th>Kategori</th>
                <th style={{ textAlign: "right" }}>Harga Modal (HPP)</th>
                <th style={{ textAlign: "right" }}>Harga / Tarif Jual</th>
                <th style={{ textAlign: "center" }}>Margin</th>
                <th style={{ textAlign: "center" }}>Stok Fisik</th>
                <th style={{ textAlign: "center" }}>Status</th>
                <th style={{ width: "90px", textAlign: "center" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {displayedItems.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "36px", color: "var(--text-muted)" }}>
                    Tidak ada item {activeTab === "service" ? "layanan jasa" : "produk"} yang ditampilkan.
                  </td>
                </tr>
              ) : (
                displayedItems.map((p) => {
                  const isService = p.type === "service";
                  const cost = Number(p.costPrice || 0);
                  const price = Number(p.price || 0);
                  const marginPct = price > 0 ? Math.round(((price - cost) / price) * 100) : 0;
                  const isLow = !isService && Number(p.stock || 0) <= Number(p.minStock || 5);

                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{p.name}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                          <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                            {p.sku || "—"}
                          </span>
                          {p.unit && (
                            <span style={{ fontSize: "10.5px", background: "var(--bg-panel-subtle)", padding: "1px 5px", borderRadius: "3px", color: "var(--text-secondary)" }}>
                              per {p.unit}
                            </span>
                          )}
                        </div>
                        {p.description && (
                          <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "3px", maxWidth: "260px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={p.description}>
                            {p.description}
                          </div>
                        )}
                      </td>

                      <td style={{ textAlign: "center" }}>
                        <span className={`badge ${isService ? "badge-purple" : "badge-blue"} badge-sm`}>
                          {isService ? "Jasa" : "Barang"}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                          {p.category || (isService ? "Layanan Umum" : "Produk Umum")}
                        </span>
                      </td>

                      <td style={{ textAlign: "right" }}>
                        <span className="num-cell" style={{ color: "var(--text-secondary)" }}>
                          {cost > 0 ? formatRp(cost) : isService ? "—" : formatRp(0)}
                        </span>
                      </td>

                      <td style={{ textAlign: "right" }}>
                        <span className="num-cell" style={{ fontWeight: 700 }}>
                          {formatRp(price)}
                        </span>
                        <div style={{ fontSize: "10.5px", color: "var(--text-muted)" }}>
                          /{p.unit || (isService ? "layanan" : "pcs")}
                        </div>
                      </td>

                      <td style={{ textAlign: "center" }}>
                        <span className="badge badge-blue badge-sm">
                          +{marginPct}%
                        </span>
                      </td>

                      <td style={{ textAlign: "center" }}>
                        {isService ? (
                          <span style={{ fontSize: "11px", color: "#7c3aed", fontWeight: 600, background: "rgba(124, 58, 237, 0.08)", padding: "3px 8px", borderRadius: "12px" }}>
                            Tak Terbatas
                          </span>
                        ) : (
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                            <input
                              type="number"
                              min="0"
                              value={p.stock}
                              onChange={(e) => adjustStock(p.id, e.target.value)}
                              style={{
                                width: "60px",
                                padding: "4px 6px",
                                textAlign: "center",
                                borderRadius: "var(--radius-sm)",
                                border: "1px solid var(--border-strong)",
                                fontFamily: "var(--font-mono)",
                                fontWeight: 700,
                              }}
                              title="Edit langsung jumlah stok fisik"
                            />
                            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{p.unit || "pcs"}</span>
                          </div>
                        )}
                      </td>

                      <td style={{ textAlign: "center" }}>
                        <Badge variant={isService ? "emerald" : isLow ? "rose" : "emerald"} size="sm">
                          {isService ? "Aktif" : isLow ? `Kritis (Min ${p.minStock || 5})` : "Tersedia"}
                        </Badge>
                      </td>

                      <td>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                          <button
                            type="button"
                            className="icon-edit-btn"
                            onClick={() => {
                              setProductToEdit(p);
                              setShowProductModal(true);
                            }}
                            title={`Edit ${isService ? "Layanan Jasa" : "Produk"}`}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            className="icon-del-btn"
                            onClick={async () => {
                              const ok = await confirm({
                                title: isService ? "Hapus Layanan Jasa" : "Hapus Produk",
                                message: `Hapus ${isService ? "layanan jasa" : "produk"} "${p.name}" dari katalog?`,
                                confirmText: "Hapus",
                                cancelText: "Batal",
                                danger: true,
                              });
                              if (ok) {
                                await deleteProduct(p.id);
                                toast.success(`${isService ? "Layanan" : "Produk"} "${p.name}" berhasil dihapus.`);
                              }
                            }}
                            title={`Hapus ${isService ? "Layanan" : "Produk"}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Produk & Jasa */}
      {showProductModal && (
        <ProductModal
          isOpen={true}
          productToEdit={productToEdit}
          onClose={() => {
            setShowProductModal(false);
            setProductToEdit(null);
          }}
        />
      )}
    </div>
  );
}
