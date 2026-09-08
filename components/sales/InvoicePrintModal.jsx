"use client";

import { Printer } from "lucide-react";
import Modal from "../ui/Modal";
import { useFinance } from "../../context/FinanceContext";
import { formatRp, formatDate } from "../../lib/formatters";
import Badge from "../ui/Badge";

export default function InvoicePrintModal({ isOpen, onClose, order }) {
  const { profile, accounts, clients } = useFinance();

  if (!order) return null;

  const clientInfo = clients.find((c) => c.id === order.clientId) || {
    name: order.clientName,
    address: "-",
    phone: "-",
  };

  const primaryBank = accounts.find((a) => a.type === "Bank") || accounts[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Invoice #${order.invoiceNumber}`} maxWidth="720px">
      <div className="printable-invoice-container">
        {/* Actions Bar */}
        <div className="print-action-bar no-print">
          <button type="button" className="btn-primary btn-sm" onClick={handlePrint}>
            <Printer size={16} /> Cetak / Simpan PDF
          </button>
        </div>

        {/* Invoice Paper Document */}
        <div className="invoice-paper" id="invoice-printable-area">
          {/* Header */}
          <div className="inv-doc-header">
            <div className="inv-doc-brand">
              <h2 className="inv-company-name">{profile?.name || "ZENTA Business"}</h2>
              <p className="inv-company-sub">{profile?.tagline || "Solusi Bisnis & Keuangan"}</p>
              <p className="inv-company-contact">
                {profile?.address && `${profile.address} • `}
                {profile?.phone && `${profile.phone} • `}
                {profile?.email}
              </p>
            </div>

            <div className="inv-doc-meta">
              <h1 className="inv-main-title">INVOICE</h1>
              <div className="inv-meta-row">
                <span className="inv-meta-label">No. Invoice:</span>
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
                <span className="inv-meta-label">Status Bayar:</span>
                <span className="inv-meta-val">
                  <Badge variant={order.paymentStatus === "Lunas" ? "emerald" : "rose"} size="sm">
                    {order.paymentStatus}
                  </Badge>
                </span>
              </div>
            </div>
          </div>

          <hr className="inv-divider" />

          {/* Client Info */}
          <div className="inv-client-section">
            <div className="inv-client-col">
              <span className="inv-section-tag">DITUJUKAN KEPADA:</span>
              <h3 className="inv-client-name">{order.clientName}</h3>
              {clientInfo.contact && <p className="inv-client-detail">Up: {clientInfo.contact}</p>}
              {clientInfo.address && clientInfo.address !== "-" && (
                <p className="inv-client-detail">{clientInfo.address}</p>
              )}
              {clientInfo.phone && clientInfo.phone !== "-" && (
                <p className="inv-client-detail">Telp: {clientInfo.phone}</p>
              )}
            </div>

            <div className="inv-payment-instruction">
              <span className="inv-section-tag">INFORMASI PEMBAYARAN:</span>
              <p className="inv-pay-bank">Bank: <strong>{primaryBank?.name || "BCA"}</strong></p>
              <p className="inv-pay-acc">No. Rek: <strong>{primaryBank?.accountNumber || "—"}</strong></p>
              <p className="inv-pay-owner">A.N: <strong>{profile?.name || "ZENTA Business"}</strong></p>
            </div>
          </div>

          {/* Table of Items */}
          <table className="inv-items-table">
            <thead>
              <tr>
                <th style={{ width: "5%" }}>No</th>
                <th style={{ width: "50%" }}>Deskripsi Produk / Layanan</th>
                <th style={{ width: "15%", textAlign: "right" }}>Harga Satuan</th>
                <th style={{ width: "10%", textAlign: "center" }}>Qty</th>
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
              <p>{order.notes || "Terima kasih atas kerja sama dan kepercayaan Anda berbisnis bersama kami."}</p>
            </div>

            <div className="inv-signature-block">
              <p className="inv-sign-city">Hormat Kami,</p>
              <div className="inv-sign-space" />
              <p className="inv-sign-name">({profile?.name || "Manajemen ZENTA"})</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
