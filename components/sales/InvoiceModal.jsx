"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Modal from "../ui/Modal";
import { useFinance } from "../../context/FinanceContext";
import { todayISO, formatRp } from "../../lib/formatters";

export default function InvoiceModal({ isOpen, onClose }) {
  const { clients, products, accounts, addOrder } = useFinance();

  const [clientId, setClientId] = useState(clients[0]?.id || "");
  const [customClientName, setCustomClientName] = useState("");
  const [date, setDate] = useState(todayISO());
  const [dueDate, setDueDate] = useState(todayISO());
  const [discount, setDiscount] = useState("0");
  const [paymentStatus, setPaymentStatus] = useState("Belum Dibayar");
  const [paidAccountId, setPaidAccountId] = useState(accounts[0]?.id || "");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const [items, setItems] = useState([
    {
      productId: products[0]?.id || "",
      productName: products[0]?.name || "",
      qty: 1,
      price: products[0]?.price || 0,
      total: products[0]?.price || 0,
    },
  ]);

  const handleProductChange = (index, prodId) => {
    const selectedProd = products.find((p) => p.id === prodId);
    if (!selectedProd) return;

    setItems((prev) => {
      const updated = [...prev];
      const qty = updated[index]?.qty || 1;
      updated[index] = {
        productId: selectedProd.id,
        productName: selectedProd.name,
        qty,
        price: selectedProd.price,
        total: qty * selectedProd.price,
      };
      return updated;
    });
  };

  const handleQtyChange = (index, qtyVal) => {
    const qty = Math.max(1, parseInt(qtyVal) || 1);
    setItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      if (item) {
        updated[index] = {
          ...item,
          qty,
          total: qty * item.price,
        };
      }
      return updated;
    });
  };

  const addItemRow = () => {
    const defaultProd = products[0];
    setItems((prev) => [
      ...prev,
      {
        productId: defaultProd?.id || "",
        productName: defaultProd?.name || "",
        qty: 1,
        price: defaultProd?.price || 0,
        total: defaultProd?.price || 0,
      },
    ]);
  };

  const removeItemRow = (index) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, it) => sum + (it.total || 0), 0);
  const numDiscount = Number(discount) || 0;
  const grandTotal = Math.max(0, subtotal - numDiscount);

  const selectedClient = clients.find((c) => c.id === clientId);
  const finalClientName = selectedClient ? selectedClient.name : customClientName || "Klien Umum";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (items.length === 0) {
      setError("Tambahkan minimal 1 item produk ke dalam invoice.");
      return;
    }
    if (grandTotal <= 0) {
      setError("Total invoice harus lebih dari 0.");
      return;
    }

    addOrder({
      clientId: clientId || null,
      clientName: finalClientName,
      date,
      dueDate,
      status: "Diproses",
      paymentStatus,
      paidAccountId: paymentStatus === "Lunas" ? paidAccountId : null,
      discount: numDiscount,
      subtotal,
      grandTotal,
      notes: notes.trim(),
      items,
    });

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Buat Invoice & Pesanan Baru" maxWidth="640px">
      <form onSubmit={handleSubmit} className="app-form">
        {error && <div className="form-alert-error">{error}</div>}

        <div className="form-row-2">
          <div className="form-group">
            <label htmlFor="inv-client">Pilih Klien / Pelanggan *</label>
            <select
              id="inv-client"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            >
              <option value="">-- Klien Baru / Klien Umum --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone || c.contact || "Klien"})
                </option>
              ))}
            </select>
          </div>

          {!clientId && (
            <div className="form-group">
              <label htmlFor="inv-custom-client">Nama Klien Bebas</label>
              <input
                id="inv-custom-client"
                type="text"
                placeholder="Contoh: Toko Maju Jaya"
                value={customClientName}
                onChange={(e) => setCustomClientName(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="form-row-2">
          <div className="form-group">
            <label htmlFor="inv-date">Tanggal Invoice *</label>
            <input
              id="inv-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="inv-due">Jatuh Tempo Pembayaran</label>
            <input
              id="inv-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        {/* Item Rows */}
        <div className="invoice-items-box">
          <div className="invoice-items-header">
            <h4>Rincian Produk / Barang Pesanan</h4>
            <button
              type="button"
              className="btn-text-action text-emerald"
              onClick={addItemRow}
            >
              <Plus size={14} /> Tambah Item
            </button>
          </div>

          <div className="items-table-wrap">
            {items.map((it, idx) => (
              <div key={idx} className="item-row-entry">
                <div className="item-col-prod">
                  <select
                    value={it.productId}
                    onChange={(e) => handleProductChange(idx, e.target.value)}
                    required
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Stok: {p.stock} | {formatRp(p.price)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="item-col-qty">
                  <input
                    type="number"
                    min="1"
                    value={it.qty}
                    onChange={(e) => handleQtyChange(idx, e.target.value)}
                    title="Kuantitas"
                    required
                  />
                </div>

                <div className="item-col-total">
                  <span>{formatRp(it.total)}</span>
                </div>

                <div className="item-col-action">
                  <button
                    type="button"
                    className="icon-del-btn"
                    onClick={() => removeItemRow(idx)}
                    disabled={items.length <= 1}
                    title="Hapus baris"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Row */}
        <div className="invoice-summary-card">
          <div className="summary-line">
            <span>Subtotal Barang:</span>
            <strong>{formatRp(subtotal)}</strong>
          </div>

          <div className="summary-line">
            <span>Potongan / Diskon (Rp):</span>
            <input
              type="number"
              min="0"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="summary-discount-input"
            />
          </div>

          <div className="summary-line summary-total">
            <span>Total Tagihan:</span>
            <span className="total-figure">{formatRp(grandTotal)}</span>
          </div>
        </div>

        <div className="form-row-2">
          <div className="form-group">
            <label htmlFor="inv-status">Status Pembayaran</label>
            <select
              id="inv-status"
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
            >
              <option value="Belum Dibayar">Belum Dibayar (Kredit/Piutang)</option>
              <option value="Lunas">Lunas (Sudah Diterima)</option>
            </select>
          </div>

          {paymentStatus === "Lunas" && (
            <div className="form-group">
              <label htmlFor="inv-account">Masuk ke Rekening *</label>
              <select
                id="inv-account"
                value={paidAccountId}
                onChange={(e) => setPaidAccountId(e.target.value)}
                required
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.type})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="inv-notes">Catatan Invoice (Opsional)</label>
          <input
            id="inv-notes"
            type="text"
            placeholder="Contoh: No PO #452, Garansi 1 tahun, dikirim ekspedisi"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Batal
          </button>
          <button type="submit" className="btn-primary">
            Terbitkan Invoice
          </button>
        </div>
      </form>
    </Modal>
  );
}
