"use client";

import { useState } from "react";
import Modal from "../ui/Modal";
import { useFinance } from "../../context/FinanceContext";

export default function ProductModal({ isOpen, onClose, productToEdit = null }) {
  const { addProduct, updateProduct } = useFinance();

  const [name, setName] = useState(productToEdit?.name || "");
  const [sku, setSku] = useState(productToEdit?.sku || "");
  const [costPrice, setCostPrice] = useState(productToEdit?.costPrice || "");
  const [price, setPrice] = useState(productToEdit?.price || "");
  const [stock, setStock] = useState(productToEdit?.stock || "10");
  const [minStock, setMinStock] = useState(productToEdit?.minStock || "5");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nama produk atau barang wajib diisi.");
      return;
    }
    const numPrice = Number(price);
    if (!numPrice || numPrice <= 0) {
      setError("Harga jual produk harus lebih dari 0.");
      return;
    }

    const payload = {
      name: name.trim(),
      sku: sku.trim() || `PRD-${Date.now().toString().slice(-4)}`,
      costPrice: Number(costPrice) || 0,
      price: numPrice,
      stock: Number(stock) || 0,
      minStock: Number(minStock) || 5,
    };

    if (productToEdit) {
      updateProduct(productToEdit.id, payload);
    } else {
      addProduct(payload);
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={productToEdit ? "Edit Data Produk" : "Tambah Produk / Inventori Baru"}
    >
      <form onSubmit={handleSubmit} className="app-form">
        {error && <div className="form-alert-error">{error}</div>}

        <div className="form-group">
          <label htmlFor="pr-name">Nama Produk / Barang *</label>
          <input
            id="pr-name"
            type="text"
            placeholder="Contoh: Mesin EDC Smart POS 4G"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            required
            autoFocus
          />
        </div>

        <div className="form-group">
          <label htmlFor="pr-sku">Kode SKU / Barcode</label>
          <input
            id="pr-sku"
            type="text"
            placeholder="Contoh: EDC-POS-01"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
          />
        </div>

        <div className="form-row-2">
          <div className="form-group">
            <label htmlFor="pr-cost">Harga Beli / Modal (HPP)</label>
            <div className="input-prefix-wrap">
              <span className="input-prefix">Rp</span>
              <input
                id="pr-cost"
                type="number"
                min="0"
                placeholder="Contoh: 1500000"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="pr-price">Harga Jual *</label>
            <div className="input-prefix-wrap">
              <span className="input-prefix">Rp</span>
              <input
                id="pr-price"
                type="number"
                min="1"
                placeholder="Contoh: 2400000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <div className="form-row-2">
          <div className="form-group">
            <label htmlFor="pr-stock">Jumlah Stok Saat Ini *</label>
            <input
              id="pr-stock"
              type="number"
              min="0"
              placeholder="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="pr-minstock">Batas Minimum Stok (Alert)</label>
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

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Batal
          </button>
          <button type="submit" className="btn-primary">
            {productToEdit ? "Simpan Perubahan" : "Simpan Produk"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
