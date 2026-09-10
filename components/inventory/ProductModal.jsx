"use client";

import { useState, useMemo } from "react";
import { Loader2, Package, Briefcase, TrendingUp } from "lucide-react";
import Modal from "../ui/Modal";
import { useFinance } from "../../context/FinanceContext";
import { useToast } from "../ui/Toast";
import { WARUNG_CATEGORIES, WARUNG_UNITS } from "../../lib/constants";
import { formatRp } from "../../lib/formatters";

const SERVICE_UNITS = [
  { value: "layanan", label: "Per Layanan" },
  { value: "jam", label: "Per Jam" },
  { value: "hari", label: "Per Hari" },
  { value: "sesi", label: "Per Sesi" },
  { value: "paket", label: "Per Paket" },
  { value: "bulan", label: "Per Bulan" },
];

export default function ProductModal({ isOpen, onClose, productToEdit = null }) {
  const { addProduct, updateProduct } = useFinance();
  const toast = useToast();

  const [type, setType] = useState(productToEdit?.type || "product");
  const [name, setName] = useState(productToEdit?.name || "");
  const [category, setCategory] = useState(productToEdit?.category || "Sembako & Beras");
  const [unit, setUnit] = useState(productToEdit?.unit || (productToEdit?.type === "service" ? "layanan" : "pcs"));
  const [description, setDescription] = useState(productToEdit?.description || "");
  const [sku, setSku] = useState(productToEdit?.sku || "");
  const [costPrice, setCostPrice] = useState(productToEdit?.costPrice ?? "");
  const [price, setPrice] = useState(productToEdit?.price ?? "");
  const [stock, setStock] = useState(productToEdit?.stock ?? (productToEdit?.type === "service" ? "0" : "10"));
  const [minStock, setMinStock] = useState(productToEdit?.minStock ?? (productToEdit?.type === "service" ? "0" : "5"));
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isService = type === "service";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(isService ? "Nama layanan atau jasa wajib diisi." : "Nama produk atau barang wajib diisi.");
      return;
    }
    const numPrice = Number(price);
    if (!numPrice || numPrice <= 0) {
      setError(isService ? "Tarif jasa harus lebih dari 0." : "Harga jual produk harus lebih dari 0.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const payload = {
      name: name.trim(),
      type,
      category: category.trim() || (isService ? "Layanan Umum" : "Produk Umum"),
      unit: unit.trim() || (isService ? "layanan" : "pcs"),
      description: description.trim(),
      sku: sku.trim() || (isService ? `SRV-${Date.now().toString().slice(-4)}` : `PRD-${Date.now().toString().slice(-4)}`),
      costPrice: Number(costPrice) || 0,
      price: numPrice,
      stock: isService ? 0 : Number(stock) || 0,
      minStock: isService ? 0 : Number(minStock) || 5,
    };

    try {
      if (productToEdit) {
        await updateProduct(productToEdit.id, payload);
        toast.success(`${isService ? "Layanan Jasa" : "Produk"} "${name.trim()}" berhasil diperbarui!`);
      } else {
        await addProduct(payload);
        toast.success(`${isService ? "Layanan Jasa" : "Produk"} "${name.trim()}" berhasil ditambahkan!`);
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError(`Gagal menyimpan data ${isService ? "jasa" : "produk"}. Silakan coba lagi.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalTitle = productToEdit
    ? isService
      ? "Edit Data Layanan Jasa"
      : "Edit Data Produk Fisik"
    : isService
    ? "Tambah Layanan Jasa Baru"
    : "Tambah Produk Fisik Baru";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
      <form onSubmit={handleSubmit} className="app-form">
        {error && <div className="form-alert-error">{error}</div>}

        {/* Segmented Type Toggle (Barang vs Jasa) */}
        {!productToEdit && (
          <div className="type-toggle-row" style={{ marginBottom: "16px" }}>
            <button
              type="button"
              className={`toggle-tab-btn ${type === "product" ? "active-product" : ""}`}
              onClick={() => {
                setType("product");
                if (unit === "layanan") setUnit("pcs");
              }}
            >
              <Package size={15} style={{ display: "inline", marginRight: "6px", verticalAlign: "-2px" }} />
              Barang / Produk Fisik
            </button>
            <button
              type="button"
              className={`toggle-tab-btn ${type === "service" ? "active-service" : ""}`}
              onClick={() => {
                setType("service");
                if (unit === "pcs") setUnit("layanan");
              }}
            >
              <Briefcase size={15} style={{ display: "inline", marginRight: "6px", verticalAlign: "-2px" }} />
              Jasa / Layanan
            </button>
          </div>
        )}

        {/* Nama Entitas */}
        <div className="form-group">
          <label htmlFor="pr-name">
            {isService ? "Nama Layanan / Jasa *" : "Nama Barang / Sembako *"}
          </label>
          <input
            id="pr-name"
            type="text"
            placeholder={
              isService
                ? "Contoh: Jasa Titip Beli Pasar, Antar Galon, Pemasangan Tabung Gas"
                : "Contoh: Beras Ramos 5kg, Telur 1kg, Gas Elpiji 3kg, Indomie Goreng"
            }
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            required
            autoFocus
          />
        </div>

        {/* Baris Harga Jual & Satuan Warung */}
        <div className="form-row-2">
          <div className="form-group">
            <label htmlFor="pr-price">
              {isService ? "Tarif Jasa *" : "Harga Jual Eceran *"}
            </label>
            <div className="input-prefix-wrap">
              <span className="input-prefix">Rp</span>
              <input
                id="pr-price"
                type="number"
                min="1"
                placeholder={isService ? "Contoh: 15000" : "Contoh: 36000"}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="pr-unit">
              {isService ? "Satuan Tarif *" : "Satuan Barang Sembako *"}
            </label>
            <select
              id="pr-unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            >
              {(isService ? SERVICE_UNITS : WARUNG_UNITS).map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Modal / HPP Kulakan & Kategori */}
        <div className="form-row-2">
          <div className="form-group">
            <label htmlFor="pr-cost">
              {isService ? "Biaya Modal / Dasar" : "Harga Modal / Kulakan (HPP)"}
            </label>
            <div className="input-prefix-wrap">
              <span className="input-prefix">Rp</span>
              <input
                id="pr-cost"
                type="number"
                min="0"
                placeholder="Contoh: 32000"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="pr-category">Kategori Barang</label>
            <input
              id="pr-category"
              list="warung-categories-list"
              type="text"
              placeholder="Pilih atau ketik kategori..."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <datalist id="warung-categories-list">
              {WARUNG_CATEGORIES.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Live Estimasi Margin Laba Warung */}
        {Number(price) > 0 && Number(costPrice) > 0 && !isService && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 12px",
              backgroundColor: Number(price) >= Number(costPrice) ? "var(--emerald-soft)" : "var(--rose-soft)",
              borderRadius: "var(--radius-sm)",
              marginBottom: "16px",
              fontSize: "12.5px",
              border: `1px solid ${Number(price) >= Number(costPrice) ? "var(--emerald-border)" : "var(--rose-border)"}`,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "6px", color: Number(price) >= Number(costPrice) ? "var(--emerald-dark)" : "var(--rose-primary)" }}>
              <TrendingUp size={15} />
              Estimasi Untung / Margin Warung:
            </span>
            <strong style={{ color: Number(price) >= Number(costPrice) ? "var(--emerald-dark)" : "var(--rose-primary)" }}>
              {Number(price) >= Number(costPrice) ? (
                <>
                  +{formatRp(Number(price) - Number(costPrice))} per {unit} ({Math.round(((Number(price) - Number(costPrice)) / Number(price)) * 100)}%)
                </>
              ) : (
                <>Rugi {formatRp(Number(costPrice) - Number(price))} (Harga jual di bawah modal!)</>
              )}
            </strong>
          </div>
        )}

        {/* Field Khusus Produk Fisik: Stok & Min Stok */}
        {!isService && (
          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="pr-stock">Jumlah Stok Saat Ini ({unit}) *</label>
              <input
                id="pr-stock"
                type="number"
                min="0"
                placeholder="Contoh: 20"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="pr-minstock">Batas Minimum Stok (Peringatan Kulakan)</label>
              <input
                id="pr-minstock"
                type="number"
                min="0"
                placeholder="5"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* SKU / Kode Unik */}
        <div className="form-group">
          <label htmlFor="pr-sku">
            {isService ? "Kode Referensi Layanan (Opsional)" : "Kode SKU / Barcode (Opsional)"}
          </label>
          <input
            id="pr-sku"
            type="text"
            placeholder={isService ? "Contoh: SRV-IT-01" : "Contoh: EDC-POS-01"}
            value={sku}
            onChange={(e) => setSku(e.target.value)}
          />
        </div>

        {/* Deskripsi */}
        <div className="form-group">
          <label htmlFor="pr-desc">Deskripsi &amp; Catatan (Opsional)</label>
          <textarea
            id="pr-desc"
            rows={2}
            placeholder={
              isService
                ? "Contoh: Termasuk konsultasi awal, instalasi perangkat lunak, dan garansi teknis 30 hari."
                : "Contoh: Spesifikasi produk, nomor seri garansi, atau catatan penyimpanan..."
            }
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
            Batal
          </button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : productToEdit ? (
              "Simpan Perubahan"
            ) : isService ? (
              "Simpan Layanan Jasa"
            ) : (
              "Simpan Produk"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

