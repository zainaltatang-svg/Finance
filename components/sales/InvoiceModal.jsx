"use client";

import { useState, useMemo } from "react";
import { Plus, Trash2, Loader2, AlertCircle, AlertTriangle, User, Calendar, CreditCard, FileText, CheckCircle2, Banknote } from "lucide-react";
import Modal from "../ui/Modal";
import { useFinance } from "../../context/FinanceContext";
import { useToast } from "../ui/Toast";
import { todayISO, formatRp, uid } from "../../lib/formatters";

export default function InvoiceModal({ isOpen, onClose }) {
  const { clients, products, accounts, addOrder } = useFinance();
  const toast = useToast();

  const [clientId, setClientId] = useState("");
  const [customClientName, setCustomClientName] = useState("");
  const [customClientAddress, setCustomClientAddress] = useState("");
  const [date, setDate] = useState(() => todayISO());
  const [dueDate, setDueDate] = useState(() => todayISO());
  const [discount, setDiscount] = useState("0");
  const [paymentStatus, setPaymentStatus] = useState("Lunas");
  const [paidAccountId, setPaidAccountId] = useState(() => {
    const cashAcc = accounts.find((a) => a.type === "Cash");
    return cashAcc?.id || accounts[0]?.id || "";
  });
  const [cashReceived, setCashReceived] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inisialisasi items dengan baris pertama yang aman
  const [items, setItems] = useState(() => {
    if (products.length > 0) {
      const firstProd = products[0];
      return [
        {
          rowId: uid(),
          productId: firstProd.id,
          productName: firstProd.name,
          qty: 1,
          price: Number(firstProd.price) || 0,
          total: Number(firstProd.price) || 0,
          isCustom: false,
        },
      ];
    }
    return [
      {
        rowId: uid(),
        productId: "",
        productName: "",
        qty: 1,
        price: 0,
        total: 0,
        isCustom: true,
      },
    ];
  });

  // Reset form ke kondisi awal saat modal ditutup
  const handleClose = () => {
    setError("");
    setIsSubmitting(false);
    onClose();
  };

  // Hitung akumulasi kuantitas produk dari seluruh baris (F03: multi-row detection)
  const totalQtyByProductId = useMemo(() => {
    const map = {};
    for (const it of items) {
      if (it.productId && !it.isCustom) {
        map[it.productId] = (map[it.productId] || 0) + (Number(it.qty) || 0);
      }
    }
    return map;
  }, [items]);

  // Deteksi apakah ada produk fisik yang kuantitasnya melebihi stok gudang
  const stockErrors = useMemo(() => {
    const errors = {};
    for (const [prodId, requestedQty] of Object.entries(totalQtyByProductId)) {
      const prod = products.find((p) => p.id === prodId);
      if (prod && prod.type !== "service") {
        const stock = Number(prod.stock) || 0;
        if (requestedQty > stock) {
          errors[prodId] = {
            productName: prod.name,
            stock,
            unit: prod.unit || "pcs",
            requestedQty,
          };
        }
      }
    }
    return errors;
  }, [totalQtyByProductId, products]);

  const hasStockError = Object.keys(stockErrors).length > 0;

  // Handler pergantian produk pada baris
  const handleProductChange = (index, val) => {
    setItems((prev) => {
      const updated = [...prev];
      const current = updated[index];
      if (!current) return prev;

      if (val === "__CUSTOM__") {
        updated[index] = {
          ...current,
          productId: "",
          productName: "",
          isCustom: true,
          price: 0,
          total: 0,
        };
        return updated;
      }

      const selectedProd = products.find((p) => p.id === val);
      if (selectedProd) {
        const qty = current.qty || 1;
        const price = Number(selectedProd.price) || 0;
        updated[index] = {
          ...current,
          productId: selectedProd.id,
          productName: selectedProd.name,
          isCustom: false,
          price,
          total: qty * price,
        };
      }
      return updated;
    });
  };

  // Handler custom name / price
  const handleCustomItemChange = (index, field, val) => {
    setItems((prev) => {
      const updated = [...prev];
      const current = updated[index];
      if (!current) return prev;

      if (field === "productName") {
        updated[index] = { ...current, productName: val };
      } else if (field === "price") {
        const numPrice = Math.max(0, Number(val) || 0);
        updated[index] = {
          ...current,
          price: numPrice,
          total: (current.qty || 1) * numPrice,
        };
      }
      return updated;
    });
  };

  // Handler kuantitas
  const handleQtyChange = (index, qtyVal) => {
    const qty = Math.max(1, parseInt(qtyVal, 10) || 1);
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

  // Tambah baris item
  const addItemRow = () => {
    if (products.length > 0) {
      const defaultProd = products[0];
      setItems((prev) => [
        ...prev,
        {
          rowId: uid(),
          productId: defaultProd.id,
          productName: defaultProd.name,
          qty: 1,
          price: Number(defaultProd.price) || 0,
          total: Number(defaultProd.price) || 0,
          isCustom: false,
        },
      ]);
    } else {
      setItems((prev) => [
        ...prev,
        {
          rowId: uid(),
          productId: "",
          productName: "",
          qty: 1,
          price: 0,
          total: 0,
          isCustom: true,
        },
      ]);
    }
  };

  // Hapus baris item
  const removeItemRow = (index) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Perhitungan Subtotal, Diskon, dan Grand Total
  const subtotal = useMemo(() => {
    return items.reduce((sum, it) => sum + (Number(it.total) || 0), 0);
  }, [items]);

  const numDiscount = Math.max(0, Number(discount) || 0);
  const grandTotal = Math.max(0, subtotal - numDiscount);
  const discountPercent = subtotal > 0 ? Math.min(100, Math.round((numDiscount / subtotal) * 100)) : 0;

  // Nama dan Klien
  const selectedClient = clients.find((c) => c.id === clientId);
  const finalClientName = selectedClient ? selectedClient.name : customClientName.trim() || "Pembeli Tunai (Eceran)";
  const finalClientAddress = selectedClient ? selectedClient.address || "" : customClientAddress.trim();

  // Kalkulasi uang tunai kasir & kembalian
  const numCashReceived = Number(cashReceived) || 0;
  const cashChange = numCashReceived > grandTotal ? numCashReceived - grandTotal : 0;

  // Quick preset jatuh tempo
  const setPresetDueDate = (days) => {
    const baseDate = new Date(date || new Date());
    baseDate.setDate(baseDate.getDate() + days);
    const y = baseDate.getFullYear();
    const m = String(baseDate.getMonth() + 1).padStart(2, "0");
    const d = String(baseDate.getDate()).padStart(2, "0");
    setDueDate(`${y}-${m}-${d}`);
  };

  // Handle submit invoice
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validasi Items
    if (items.length === 0) {
      setError("Tambahkan minimal 1 item produk atau jasa ke dalam invoice.");
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.productName.trim()) {
        setError(`Item baris ke-${i + 1} belum memiliki nama produk atau jasa.`);
        return;
      }
      if (!it.qty || it.qty <= 0) {
        setError(`Kuantitas untuk "${it.productName}" harus minimal 1.`);
        return;
      }
      if (it.price < 0) {
        setError(`Harga untuk "${it.productName}" tidak boleh bernilai negatif.`);
        return;
      }
    }

    // Validasi Stok Fisik
    if (hasStockError) {
      const firstErr = Object.values(stockErrors)[0];
      setError(
        `Stok untuk "${firstErr.productName}" tidak mencukupi. Diminta total: ${firstErr.requestedQty}, stok tersedia di gudang: ${firstErr.stock} ${firstErr.unit}.`
      );
      return;
    }

    // Validasi Pembeli jika Kasbon
    if (paymentStatus === "Belum Dibayar" && !clientId && !customClientName.trim()) {
      setError("Untuk transaksi Kasbon / Hutang, wajib mencatat nama pembeli.");
      return;
    }

    // Validasi Diskon
    if (numDiscount > subtotal) {
      setError("Jumlah potongan diskon tidak boleh melebihi subtotal belanja.");
      return;
    }

    // Validasi Akun jika Lunas
    if (paymentStatus === "Lunas" && !paidAccountId) {
      setError("Pilih rekening tujuan kas/bank untuk mencatat pelunasan otomatis.");
      return;
    }

    setIsSubmitting(true);

    try {
      await addOrder({
        clientId: clientId || null,
        clientName: finalClientName,
        clientAddress: finalClientAddress,
        date,
        dueDate,
        status: "Diproses",
        paymentStatus,
        paidAccountId: paymentStatus === "Lunas" ? paidAccountId : null,
        discount: numDiscount,
        subtotal,
        grandTotal,
        notes: notes.trim(),
        items: items.map((it) => ({
          productId: it.productId || null,
          productName: it.productName.trim(),
          qty: Number(it.qty) || 1,
          price: Number(it.price) || 0,
          total: Number(it.total) || 0,
        })),
      });

      toast.success(`Invoice untuk "${finalClientName}" (${formatRp(grandTotal)}) berhasil diterbitkan!`);
      handleClose();
    } catch (err) {
      console.error(err);
      setError(err.message || "Gagal menerbitkan invoice. Silakan periksa kembali data Anda.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Kasir & Penjualan Warung" maxWidth="680px">
      <form onSubmit={handleSubmit} className="app-form" style={{ minWidth: 0, width: "100%", boxSizing: "border-box" }}>
        {error && (
          <div className="form-alert-error" style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
            <AlertCircle size={17} style={{ flexShrink: 0, marginTop: "2px" }} />
            <span>{error}</span>
          </div>
        )}

        {/* SECTION 1: PEMBELI / BUKU KASBON */}
        <div style={{ backgroundColor: "var(--bg-panel-subtle)", padding: "14px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", boxSizing: "border-box", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <User size={16} className="text-emerald" />
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
              Data Pembeli / Pelanggan Kasbon
            </span>
          </div>

          <div className="form-row-2" style={{ minWidth: 0 }}>
            <div className="form-group" style={{ marginBottom: 0, minWidth: 0 }}>
              <label htmlFor="inv-client">Pilih dari Langganan / Buku Kasbon</label>
              <select
                id="inv-client"
                value={clientId}
                onChange={(e) => {
                  setClientId(e.target.value);
                  if (e.target.value) {
                    setCustomClientName("");
                    setCustomClientAddress("");
                  }
                }}
                style={{ width: "100%", minWidth: 0 }}
              >
                <option value="">-- Pembeli Tunai / Eceran Langsung --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.address ? `(${c.address})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {!clientId && (
              <div className="form-group" style={{ marginBottom: 0, minWidth: 0 }}>
                <label htmlFor="inv-custom-client">
                  Nama Pembeli {paymentStatus === "Belum Dibayar" ? <span style={{ color: "var(--rose-primary)" }}>* (Wajib jika kasbon)</span> : "(Opsional)"}
                </label>
                <input
                  id="inv-custom-client"
                  type="text"
                  placeholder="Contoh: Bu RT Endang / Pak Joko"
                  value={customClientName}
                  onChange={(e) => setCustomClientName(e.target.value)}
                  style={{ width: "100%", minWidth: 0 }}
                />
              </div>
            )}
          </div>

          {!clientId && (
            <div className="form-group" style={{ marginTop: "12px", marginBottom: 0, minWidth: 0 }}>
              <label htmlFor="inv-custom-address">Alamat / Kontak Klien (Opsional untuk cetak)</label>
              <input
                id="inv-custom-address"
                type="text"
                placeholder="Contoh: Jl. Sudirman No. 45, Jakarta"
                value={customClientAddress}
                onChange={(e) => setCustomClientAddress(e.target.value)}
                style={{ width: "100%", minWidth: 0 }}
              />
            </div>
          )}

          {selectedClient && (
            <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--text-secondary)", display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <span>📞 {selectedClient.phone || selectedClient.contact || "Tidak ada nomor telp"}</span>
              {selectedClient.address && <span>📍 {selectedClient.address}</span>}
            </div>
          )}
        </div>

        {/* SECTION 2: TANGGAL & JATUH TEMPO */}
        <div className="form-row-2" style={{ minWidth: 0 }}>
          <div className="form-group" style={{ minWidth: 0 }}>
            <label htmlFor="inv-date">
              <Calendar size={13} style={{ display: "inline", marginRight: "4px" }} />
              Tanggal Terbit Invoice *
            </label>
            <input
              id="inv-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              style={{ width: "100%", minWidth: 0 }}
            />
          </div>

          <div className="form-group" style={{ minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <label htmlFor="inv-due" style={{ margin: 0 }}>Jatuh Tempo</label>
              <div style={{ display: "flex", gap: "4px" }}>
                <button type="button" className="btn-secondary" style={{ padding: "2px 6px", fontSize: "10.5px" }} onClick={() => setPresetDueDate(7)}>+7h</button>
                <button type="button" className="btn-secondary" style={{ padding: "2px 6px", fontSize: "10.5px" }} onClick={() => setPresetDueDate(14)}>+14h</button>
                <button type="button" className="btn-secondary" style={{ padding: "2px 6px", fontSize: "10.5px" }} onClick={() => setPresetDueDate(30)}>+30h</button>
              </div>
            </div>
            <input
              id="inv-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={{ width: "100%", minWidth: 0 }}
            />
          </div>
        </div>

        {/* SECTION 3: DAFTAR BELANJAAN BARANG SEMBAKO */}
        <div className="invoice-items-box" style={{ boxSizing: "border-box", width: "100%", minWidth: 0 }}>
          <div className="invoice-items-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <div>
              <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>Daftar Barang Belanjaan</h4>
              <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                Pilih barang sembako atau tulis item bebas
              </span>
            </div>
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={addItemRow}
              style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "var(--emerald-dark)" }}
            >
              <Plus size={14} /> Tambah Item
            </button>
          </div>

          {products.length === 0 && (
            <div style={{ padding: "10px 12px", backgroundColor: "var(--emerald-soft)", color: "var(--emerald-dark)", borderRadius: "var(--radius-sm)", fontSize: "12px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
              <AlertCircle size={15} /> Katalog produk masih kosong. Anda dapat mengetikkan nama item dan harga secara manual.
            </div>
          )}

          {/* Table / List Wrap */}
          <div className="items-table-wrap" style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", minWidth: 0 }}>
            {items.map((it, idx) => {
              const selectedProduct = products.find((p) => p.id === it.productId);
              const isPhysical = selectedProduct && selectedProduct.type !== "service";
              const currentStock = isPhysical ? Number(selectedProduct.stock) || 0 : null;
              const totalRequired = it.productId ? totalQtyByProductId[it.productId] || 0 : 0;
              const isItemOverStock = isPhysical && totalRequired > currentStock;

              return (
                <div
                  key={it.rowId || idx}
                  className={`item-row-entry ${isItemOverStock ? "has-stock-error" : ""}`}
                >
                  {/* Kolom 1: Produk / Layanan */}
                  <div className="item-col-prod">
                    {!it.isCustom ? (
                      <div style={{ width: "100%", minWidth: 0 }}>
                        <select
                          value={it.productId}
                          onChange={(e) => handleProductChange(idx, e.target.value)}
                          required
                          style={{ fontSize: "13px", width: "100%", minWidth: 0 }}
                        >
                          <option value="" disabled>-- Pilih Produk / Jasa --</option>
                          {products.map((p) => {
                            const isService = p.type === "service";
                            const label = isService
                              ? `💼 [Jasa] ${p.name} — ${formatRp(p.price)} / ${p.unit || "sesi"}`
                              : `📦 [Barang] ${p.name} (Stok: ${p.stock} ${p.unit || "pcs"}) — ${formatRp(p.price)}`;
                            return (
                              <option key={p.id} value={p.id}>
                                {label}
                              </option>
                            );
                          })}
                          <option value="__CUSTOM__">✍️ + Tulis Item Manual / Kustom...</option>
                        </select>

                        {/* Status stok */}
                        {isPhysical && (
                          <div style={{ fontSize: "11px", marginTop: "4px", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                            <span style={{ color: isItemOverStock ? "var(--rose-primary)" : "var(--text-muted)" }}>
                              Gudang: {currentStock} {selectedProduct.unit || "pcs"}
                              {items.filter((x) => x.productId === it.productId).length > 1 && ` (Total diminta: ${totalRequired})`}
                            </span>
                            {isItemOverStock && (
                              <span style={{ color: "var(--rose-primary)", fontWeight: 700 }}>
                                ⚠️ Melebihi stok!
                              </span>
                            )}
                          </div>
                        )}
                        {selectedProduct && selectedProduct.type === "service" && (
                          <div style={{ fontSize: "11px", marginTop: "3px", color: "var(--emerald-dark)" }}>
                            💼 Layanan Jasa (tanpa batas stok)
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", width: "100%", minWidth: 0, flexWrap: "wrap" }}>
                        <input
                          type="text"
                          placeholder="Nama item *"
                          value={it.productName}
                          onChange={(e) => handleCustomItemChange(idx, "productName", e.target.value)}
                          required
                          style={{ fontSize: "13px", flex: "1 1 140px", minWidth: 0 }}
                        />
                        <input
                          type="number"
                          min="0"
                          placeholder="Harga (Rp)"
                          value={it.price || ""}
                          onChange={(e) => handleCustomItemChange(idx, "price", e.target.value)}
                          title="Harga Satuan"
                          style={{ fontSize: "13px", width: "100px", minWidth: 0, fontFamily: "var(--font-mono)" }}
                          required
                        />
                        {products.length > 0 && (
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ padding: "4px 8px", fontSize: "11px", whiteSpace: "nowrap" }}
                            onClick={() => handleProductChange(idx, products[0]?.id || "")}
                            title="Pilih dari katalog"
                          >
                            Katalog
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Wrapper Baris Bawah untuk Mobile / 3 Kolom Desktop */}
                  <div className="item-row-bottom">
                    {/* Kolom 2: Jumlah Qty */}
                    <div className="item-col-qty">
                      <span className="item-qty-label-mobile">Jumlah:</span>
                      <input
                        type="number"
                        min="1"
                        value={it.qty}
                        onChange={(e) => handleQtyChange(idx, e.target.value)}
                        title="Jumlah Beli"
                        required
                        style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontWeight: 700 }}
                      />
                    </div>

                    {/* Kolom 3: Total Subtotal Baris */}
                    <div className="item-col-total">
                      <span>{formatRp(it.total)}</span>
                    </div>

                    {/* Kolom 4: Aksi Hapus */}
                    <div className="item-col-action">
                      <button
                        type="button"
                        className="icon-del-btn"
                        onClick={() => removeItemRow(idx)}
                        disabled={items.length <= 1}
                        title={items.length <= 1 ? "Minimal 1 barang" : "Hapus barang"}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 4: KARTU TOTAL & POTONGAN DISKON */}
        <div className="invoice-summary-card" style={{ boxSizing: "border-box", width: "100%" }}>
          <div className="summary-line">
            <span>Subtotal Item ({items.length} item):</span>
            <strong>{formatRp(subtotal)}</strong>
          </div>

          <div className="summary-line">
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              Potongan Diskon (Rp):
              {discountPercent > 0 && (
                <span style={{ fontSize: "11px", backgroundColor: "var(--rose-soft)", color: "var(--rose-primary)", padding: "2px 6px", borderRadius: "var(--radius-sm)", fontWeight: 700 }}>
                  Hemat {discountPercent}%
                </span>
              )}
            </span>
            <input
              type="number"
              min="0"
              max={subtotal}
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="summary-discount-input"
              placeholder="0"
            />
          </div>

          <div className="summary-line summary-total">
            <span style={{ fontSize: "15px" }}>Total Tagihan Invoice:</span>
            <span className="total-figure">{formatRp(grandTotal)}</span>
          </div>
        </div>

        {/* SECTION 5: KASIR PEMBAYARAN & HITUNG KEMBALIAN */}
        <div style={{ backgroundColor: "var(--bg-panel-subtle)", padding: "14px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", boxSizing: "border-box", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <CreditCard size={16} className="text-emerald" />
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
              Ketentuan Pembayaran Kasir
            </span>
          </div>

          <div className="form-row-2" style={{ minWidth: 0 }}>
            <div className="form-group" style={{ marginBottom: 0, minWidth: 0 }}>
              <label htmlFor="inv-status">Status Pembayaran</label>
              <select
                id="inv-status"
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                style={{ width: "100%", minWidth: 0 }}
              >
                <option value="Lunas">✅ Lunas (Tunai / QRIS / Transfer)</option>
                <option value="Belum Dibayar">📝 Kasbon / Hutang Warung</option>
              </select>
            </div>

            {paymentStatus === "Lunas" && (
              <div className="form-group" style={{ marginBottom: 0, minWidth: 0 }}>
                <label htmlFor="inv-account">
                  Penerimaan Kas / Bank <span style={{ color: "var(--rose-primary)" }}>*</span>
                </label>
                {accounts.length > 0 ? (
                  <select
                    id="inv-account"
                    value={paidAccountId}
                    onChange={(e) => setPaidAccountId(e.target.value)}
                    required
                    style={{ width: "100%", minWidth: 0 }}
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.type}) — Saldo: {formatRp(acc.initialBalance || 0)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div style={{ padding: "8px 10px", backgroundColor: "var(--rose-soft)", color: "var(--rose-primary)", borderRadius: "var(--radius-sm)", fontSize: "12px" }}>
                    ⚠️ Belum ada akun kas laci.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* KALKULATOR KEMBALIAN TUNAI KASIR */}
          {paymentStatus === "Lunas" && accounts.find((a) => a.id === paidAccountId)?.type === "Cash" && (
            <div style={{ marginTop: "14px", padding: "12px", backgroundColor: "var(--bg-panel)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
              <label htmlFor="cash-received" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", fontWeight: 600, marginBottom: "6px" }}>
                <Banknote size={15} className="text-emerald" />
                Uang Tunai Diterima dari Pembeli:
              </label>

              <div className="input-prefix-wrap" style={{ marginBottom: "8px" }}>
                <span className="input-prefix">Rp</span>
                <input
                  id="cash-received"
                  type="number"
                  min="0"
                  placeholder="Ketik uang yang diberikan pembeli..."
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: 700 }}
                />
              </div>

              {/* Tombol Cepat Pecahan */}
              <div className="quick-cash-grid">
                <button
                  type="button"
                  className="quick-cash-btn"
                  onClick={() => setCashReceived(String(grandTotal))}
                >
                  Uang Pas ({formatRp(grandTotal)})
                </button>
                {[10000, 20000, 50000, 100000, 200000].map((nominal) => (
                  <button
                    key={nominal}
                    type="button"
                    className="quick-cash-btn"
                    onClick={() => setCashReceived(String(nominal))}
                  >
                    {formatRp(nominal)}
                  </button>
                ))}
              </div>

              {/* Tampilan Kembalian */}
              {numCashReceived > 0 && (
                <div
                  style={{
                    marginTop: "10px",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: numCashReceived >= grandTotal ? "var(--emerald-soft)" : "var(--rose-soft)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    border: `1px solid ${numCashReceived >= grandTotal ? "var(--emerald-border)" : "var(--rose-border)"}`,
                  }}
                >
                  <span style={{ fontSize: "13px", fontWeight: 600, color: numCashReceived >= grandTotal ? "var(--emerald-dark)" : "var(--rose-primary)" }}>
                    {numCashReceived >= grandTotal ? "Kembalian Tunai:" : "Uang Masih Kurang:"}
                  </span>
                  <span style={{ fontSize: "18px", fontWeight: 800, fontFamily: "var(--font-mono)", color: numCashReceived >= grandTotal ? "var(--emerald-dark)" : "var(--rose-primary)" }}>
                    {numCashReceived >= grandTotal ? formatRp(cashChange) : formatRp(grandTotal - numCashReceived)}
                  </span>
                </div>
              )}
            </div>
          )}

          {paymentStatus === "Belum Dibayar" && (
            <div style={{ marginTop: "10px", fontSize: "12px", color: "var(--amber-dark)", backgroundColor: "var(--amber-soft)", padding: "8px 12px", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", gap: "6px" }}>
              <AlertTriangle size={15} />
              <span>Belanjaan ini akan dicatat ke <strong>Buku Kasbon Warung</strong> atas nama <strong>{finalClientName}</strong>.</span>
            </div>
          )}

          {paymentStatus === "Lunas" && accounts.length > 0 && (
            <div style={{ marginTop: "8px", fontSize: "11.5px", color: "var(--emerald-dark)", display: "flex", alignItems: "center", gap: "6px" }}>
              <CheckCircle2 size={13} />
              <span>Mutasi pemasukan kas sebesar <strong>{formatRp(grandTotal)}</strong> akan dicatat otomatis.</span>
            </div>
          )}
        </div>

        {/* SECTION 6: CATATAN INVOICE */}
        <div className="form-group" style={{ marginBottom: 0, minWidth: 0 }}>
          <label htmlFor="inv-notes">
            <FileText size={13} style={{ display: "inline", marginRight: "4px" }} />
            Catatan Tambahan (Opsional)
          </label>
          <input
            id="inv-notes"
            type="text"
            placeholder="Contoh: Titipan tetangga, kembalian permen, dll."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ width: "100%", minWidth: 0 }}
          />
        </div>

        {/* MODAL ACTIONS */}
        <div className="modal-actions" style={{ marginTop: "16px", minWidth: 0 }}>
          <button type="button" className="btn-secondary" onClick={handleClose} disabled={isSubmitting}>
            Batal
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting || hasStockError || (paymentStatus === "Lunas" && accounts.length === 0)}
            style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Menyimpan Transaksi...</span>
              </>
            ) : hasStockError ? (
              <>
                <AlertTriangle size={16} />
                <span>Stok Tidak Cukup</span>
              </>
            ) : (
              <span>Simpan Transaksi Kasir ({formatRp(grandTotal)})</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
