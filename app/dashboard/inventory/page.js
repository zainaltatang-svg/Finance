"use client";

import { useState } from "react";
import { Plus, AlertTriangle, Package, Edit2, Trash2, CheckCircle2 } from "lucide-react";
import { useFinance } from "../../../context/FinanceContext";
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

  const [showProductModal, setShowProductModal] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);

  const displayedProducts = filterLowStockOnly
    ? products.filter((p) => Number(p.stock || 0) <= Number(p.minStock || 5))
    : products;

  return (
    <div className="inventory-page">
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 700 }}>Inventori &amp; Valuasi Stok Produk</h2>
          <p style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
            Pantau stok barang, harga modal HPP, harga jual, dan total aset inventori bisnis.
          </p>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setProductToEdit(null);
            setShowProductModal(true);
          }}
        >
          <Plus size={16} /> Tambah Produk Baru
        </button>
      </div>

      {/* KPI Cards: Valuasi Aset Stok */}
      <div className="stats-grid-4" style={{ marginBottom: "24px" }}>
        <div className="stat-card stat-card-gold" style={{ padding: "16px 20px" }}>
          <span className="stat-card-title">Total Nilai Aset Stok (HPP)</span>
          <div className="stat-card-value">{formatRp(inventoryValuation.totalCostValuation)}</div>
          <span className="stat-card-sub">Modal yang tertanam di stok</span>
        </div>

        <div className="stat-card stat-card-emerald" style={{ padding: "16px 20px" }}>
          <span className="stat-card-title">Estimasi Nilai Retail (Jual)</span>
          <div className="stat-card-value text-emerald">{formatRp(inventoryValuation.totalRetailValuation)}</div>
          <span className="stat-card-sub">Jika seluruh stok terjual</span>
        </div>

        <div className="stat-card stat-card-blue" style={{ padding: "16px 20px" }}>
          <span className="stat-card-title">Potensi Keuntungan Kotor</span>
          <div className="stat-card-value text-blue">{formatRp(inventoryValuation.potentialProfit)}</div>
          <span className="stat-card-sub">Margin laba barang berjalan</span>
        </div>

        <div className="stat-card" style={{ padding: "16px 20px" }}>
          <span className="stat-card-title">Total Kuantitas Fisik</span>
          <div className="stat-card-value">{inventoryValuation.totalStockQty} unit</div>
          <span className="stat-card-sub">{products.length} SKU katalog produk</span>
        </div>
      </div>

      {/* Filter / Toggle Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            className={`btn-secondary btn-sm ${!filterLowStockOnly ? "btn-primary" : ""}`}
            onClick={() => setFilterLowStockOnly(false)}
          >
            Semua Produk ({products.length})
          </button>
          <button
            type="button"
            className={`btn-secondary btn-sm ${filterLowStockOnly ? "btn-rose" : ""}`}
            onClick={() => setFilterLowStockOnly(true)}
          >
            <AlertTriangle size={14} /> Stok Menipis / Kritis (
            {products.filter((p) => Number(p.stock || 0) <= Number(p.minStock || 5)).length})
          </button>
        </div>
      </div>

      {/* Tabel Inventori */}
      <div className="panel-card" style={{ padding: 0 }}>
        <div className="table-responsive">
          <table className="app-table">
            <thead>
              <tr>
                <th>Nama Produk &amp; SKU</th>
                <th style={{ textAlign: "right" }}>Harga Modal (HPP)</th>
                <th style={{ textAlign: "right" }}>Harga Jual</th>
                <th style={{ textAlign: "center" }}>Margin Laba</th>
                <th style={{ textAlign: "center" }}>Stok Fisik</th>
                <th style={{ textAlign: "center" }}>Status</th>
                <th style={{ width: "90px", textAlign: "center" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {displayedProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "36px", color: "var(--text-muted)" }}>
                    Tidak ada produk yang ditampilkan.
                  </td>
                </tr>
              ) : (
                displayedProducts.map((p) => {
                  const cost = Number(p.costPrice || 0);
                  const price = Number(p.price || 0);
                  const marginPct = price > 0 ? Math.round(((price - cost) / price) * 100) : 0;
                  const isLow = Number(p.stock || 0) <= Number(p.minStock || 5);

                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{p.name}</div>
                        <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                          SKU: {p.sku || "—"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span className="num-cell" style={{ color: "var(--text-secondary)" }}>
                          {formatRp(cost)}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span className="num-cell" style={{ fontWeight: 700 }}>
                          {formatRp(price)}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span className="badge badge-blue badge-sm">
                          +{marginPct}%
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
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
                            title="Edit langsung jumlah stok"
                          />
                        </div>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <Badge variant={isLow ? "rose" : "emerald"} size="sm">
                          {isLow ? `Kritis (Min ${p.minStock || 5})` : "Tersedia"}
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
                            title="Edit Produk"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            className="icon-del-btn"
                            onClick={() => {
                              if (confirm(`Hapus produk "${p.name}" dari inventori?`)) {
                                deleteProduct(p.id);
                              }
                            }}
                            title="Hapus Produk"
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

      {/* Modal Produk */}
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
