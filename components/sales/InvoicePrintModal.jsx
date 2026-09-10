"use client";

import { useState } from "react";
import { Printer, Share2, Receipt, FileText } from "lucide-react";
import Modal from "../ui/Modal";
import { useFinance } from "../../context/FinanceContext";
import { formatRp, formatDate } from "../../lib/formatters";
import Badge from "../ui/Badge";

export default function InvoicePrintModal({ isOpen, onClose, order }) {
  const { profile, accounts, clients } = useFinance();
  const [printMode, setPrintMode] = useState("thermal"); // 'thermal' | 'standard'

  if (!order) return null;

  const clientInfo = clients.find((c) => c.id === order.clientId) || {
    name: order.clientName,
    address: order.clientAddress || "-",
    phone: "-",
  };

  const primaryBank = accounts.find((a) => a.type === "Bank") || accounts[0];

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const warungName = profile?.name || "Warung Kelontong Berkah";
    const cleanPhone = (clientInfo.phone || "").replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.startsWith("0") ? `62${cleanPhone.slice(1)}` : cleanPhone;

    const itemsText = order.items?.map((it, idx) => `${idx + 1}. ${it.productName} (${it.qty}x) = ${formatRp(it.total)}`).join("\n") || "";

    const message = `*NOTA BELANJA WARUNG*
*${warungName}*
${profile?.address || ""}
------------------------------------
No. Transaksi : ${order.invoiceNumber}
Tanggal       : ${formatDate(order.date)}
Pembeli       : ${order.clientName}

*Rincian Belanja:*
${itemsText}
------------------------------------
Total Belanja : *${formatRp(order.grandTotal)}*
Status Bayar  : *${order.paymentStatus === "Lunas" ? "LUNAS ✅" : "KASBON / HUTANG WARUNG 📝"}*
${order.paymentStatus !== "Lunas" && order.dueDate ? `Rencana Lunas : ${formatDate(order.dueDate)}\n` : ""}${order.notes ? `Catatan : ${order.notes}\n` : ""}
Terima kasih telah belanja di ${warungName}! 🙏 Semoga berkah & sehat selalu.`;

    const url = formattedPhone
      ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Nota / Struk #${order.invoiceNumber}`} maxWidth={printMode === "thermal" ? "420px" : "720px"}>
      <div className="printable-invoice-container">
        {/* Actions Bar & Mode Switcher */}
        <div className="print-action-bar no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              type="button"
              className={`btn-secondary btn-sm ${printMode === "thermal" ? "btn-primary" : ""}`}
              onClick={() => setPrintMode("thermal")}
            >
              <Receipt size={14} /> Struk Thermal (Kasir)
            </button>
            <button
              type="button"
              className={`btn-secondary btn-sm ${printMode === "standard" ? "btn-primary" : ""}`}
              onClick={() => setPrintMode("standard")}
            >
              <FileText size={14} /> Nota Standar (A4)
            </button>
          </div>

          <div style={{ display: "flex", gap: "6px" }}>
            <button type="button" className="btn-secondary btn-sm" onClick={handleShareWhatsApp} style={{ color: "#16a34a", borderColor: "#86efac" }}>
              <Share2 size={14} /> Kirim WhatsApp
            </button>
            <button type="button" className="btn-primary btn-sm" onClick={handlePrint}>
              <Printer size={14} /> Cetak Struk
            </button>
          </div>
        </div>

        {/* MODE 1: STRUK THERMAL 58mm / 80mm */}
        {printMode === "thermal" ? (
          <div className="thermal-receipt-paper" id="invoice-printable-area">
            <h3 style={{ textTransform: "uppercase" }}>{profile?.name || "WARUNG KELONTONG"}</h3>
            <p className="thermal-center" style={{ margin: "2px 0", fontSize: "11px" }}>{profile?.tagline || "Sembako Lengkap & Murah"}</p>
            {profile?.address && <p className="thermal-center" style={{ margin: "2px 0", fontSize: "10.5px" }}>{profile.address}</p>}
            {profile?.phone && <p className="thermal-center" style={{ margin: "2px 0", fontSize: "10.5px" }}>Telp: {profile.phone}</p>}

            <div className="thermal-dashed-line" />

            <div className="thermal-flex-row" style={{ fontSize: "11px" }}>
              <span>No : {order.invoiceNumber}</span>
              <span>{formatDate(order.date)}</span>
            </div>
            <div className="thermal-flex-row" style={{ fontSize: "11px" }}>
              <span>Pelanggan :</span>
              <strong>{order.clientName}</strong>
            </div>

            <div className="thermal-dashed-line" />

            {/* List Item Belanja */}
            <div style={{ marginBottom: "6px" }}>
              {order.items?.map((it, idx) => (
                <div key={idx} style={{ marginBottom: "4px" }}>
                  <div style={{ fontWeight: 600 }}>{it.productName}</div>
                  <div className="thermal-flex-row" style={{ fontSize: "11px", color: "#333" }}>
                    <span>{it.qty} x {formatRp(it.price)}</span>
                    <span>{formatRp(it.total)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="thermal-dashed-line" />

            <div className="thermal-flex-row">
              <span>Subtotal:</span>
              <span>{formatRp(order.subtotal || order.grandTotal)}</span>
            </div>

            {order.discount > 0 && (
              <div className="thermal-flex-row">
                <span>Diskon:</span>
                <span>- {formatRp(order.discount)}</span>
              </div>
            )}

            <div className="thermal-flex-row" style={{ fontSize: "13px", fontWeight: 700 }}>
              <span>TOTAL:</span>
              <span>{formatRp(order.grandTotal)}</span>
            </div>

            <div className="thermal-flex-row" style={{ marginTop: "4px" }}>
              <span>Status:</span>
              <strong>{order.paymentStatus === "Lunas" ? "LUNAS (TUNAI/QRIS)" : "KASBON WARUNG"}</strong>
            </div>

            {order.paymentStatus !== "Lunas" && order.dueDate && (
              <div className="thermal-flex-row" style={{ fontSize: "11px" }}>
                <span>Jatuh Tempo:</span>
                <span>{formatDate(order.dueDate)}</span>
              </div>
            )}

            <div className="thermal-dashed-line" />

            <p className="thermal-center" style={{ margin: "6px 0 2px", fontSize: "11px", fontWeight: 600 }}>
              TERIMA KASIH ATAS KUNJUNGAN ANDA
            </p>
            <p className="thermal-center" style={{ margin: 0, fontSize: "10px", color: "#555" }}>
              Barang yang sudah dibeli dapat ditukar jika ada kerusakan kemasan saat belanja.
            </p>
          </div>
        ) : (
          /* MODE 2: NOTA FAKTUR STANDAR (A4) */
          <div className="invoice-paper" id="invoice-printable-area">
            {/* Header */}
            <div className="inv-doc-header">
              <div className="inv-doc-brand">
                <h2 className="inv-company-name">{profile?.name || "Warung Kelontong Berkah"}</h2>
                <p className="inv-company-sub">{profile?.tagline || "Sembako Lengkap, Murah & Bersahabat"}</p>
                <p className="inv-company-contact">
                  {profile?.address && `${profile.address} • `}
                  {profile?.phone && `${profile.phone} • `}
                  {profile?.email}
                </p>
              </div>

              <div className="inv-doc-meta">
                <h1 className="inv-main-title">NOTA BELANJA</h1>
                <div className="inv-meta-row">
                  <span className="inv-meta-label">No. Nota:</span>
                  <span className="inv-meta-val"><strong>{order.invoiceNumber}</strong></span>
                </div>
                <div className="inv-meta-row">
                  <span className="inv-meta-label">Tanggal:</span>
                  <span className="inv-meta-val">{formatDate(order.date)}</span>
                </div>
                <div className="inv-meta-row">
                  <span className="inv-meta-label">Jatuh Tempo:</span>
                  <span className="inv-meta-val">{formatDate(order.dueDate || order.date)}</span>
                </div>
                <div className="inv-meta-row" style={{ marginTop: 6 }}>
                  <span className="inv-meta-label">Status:</span>
                  <span className="inv-meta-val">
                    <Badge variant={order.paymentStatus === "Lunas" ? "emerald" : "rose"} size="sm">
                      {order.paymentStatus === "Lunas" ? "Lunas" : "Kasbon Warung"}
                    </Badge>
                  </span>
                </div>
              </div>
            </div>

            <hr className="inv-divider" />

            {/* Client Info */}
            <div className="inv-client-section">
              <div className="inv-client-col">
                <span className="inv-section-tag">PELANGGAN:</span>
                <h3 className="inv-client-name">{order.clientName}</h3>
                {clientInfo.address && clientInfo.address !== "-" && (
                  <p className="inv-client-detail">{clientInfo.address}</p>
                )}
                {clientInfo.phone && clientInfo.phone !== "-" && (
                  <p className="inv-client-detail">Telp: {clientInfo.phone}</p>
                )}
              </div>

              <div className="inv-payment-instruction">
                <span className="inv-section-tag">INFORMASI PEMBAYARAN:</span>
                <p className="inv-pay-bank">Rekening: <strong>{primaryBank?.name || "Kas Laci Toko"}</strong></p>
                {primaryBank?.accountNumber && primaryBank.accountNumber !== "-" && (
                  <p className="inv-pay-acc">No. Rek / Akun: <strong>{primaryBank.accountNumber}</strong></p>
                )}
                <p className="inv-pay-owner">A.N: <strong>{profile?.name || "Warung Kelontong Berkah"}</strong></p>
              </div>
            </div>

            {/* Table of Items */}
            <table className="inv-items-table">
              <thead>
                <tr>
                  <th style={{ width: "5%" }}>No</th>
                  <th style={{ width: "50%" }}>Barang Belanjaan</th>
                  <th style={{ width: "15%", textAlign: "right" }}>Harga Satuan</th>
                  <th style={{ width: "10%", textAlign: "center" }}>Jumlah</th>
                  <th style={{ width: "20%", textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>
                      <strong>{item.productName}</strong>
                    </td>
                    <td style={{ textAlign: "right" }}>{formatRp(item.price)}</td>
                    <td style={{ textAlign: "center" }}>{item.qty}</td>
                    <td style={{ textAlign: "right" }}>{formatRp(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals Section */}
            <div className="inv-totals-box">
              <div className="inv-totals-rows">
                <div className="inv-total-line">
                  <span>Subtotal:</span>
                  <strong>{formatRp(order.subtotal || order.grandTotal)}</strong>
                </div>
                {order.discount > 0 && (
                  <div className="inv-total-line text-rose">
                    <span>Diskon:</span>
                    <strong>- {formatRp(order.discount)}</strong>
                  </div>
                )}
                <div className="inv-total-line inv-grand-line">
                  <span>Total Tagihan:</span>
                  <span className="inv-grand-num">{formatRp(order.grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Notes & Signature */}
            <div className="inv-footer-section">
              <div className="inv-notes-block">
                <span className="inv-section-tag">CATATAN:</span>
                <p>{order.notes || "Terima kasih sudah belanja di warung kami. Semoga berkah selalu."}</p>
              </div>

              <div className="inv-signature-block">
                <p className="inv-sign-city">Salam Ramah,</p>
                <div className="inv-sign-space" />
                <p className="inv-sign-name">({profile?.name || "Pengelola Warung"})</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

