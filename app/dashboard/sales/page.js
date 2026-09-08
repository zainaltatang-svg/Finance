"use client";

import { useState } from "react";
import { Plus, Printer, Trash2, Edit2, CheckCircle2, Users, FileText, ShoppingBag } from "lucide-react";
import { useFinance } from "../../../context/FinanceContext";
import { formatRp, formatDate } from "../../../lib/formatters";
import Badge from "../../../components/ui/Badge";
import InvoiceModal from "../../../components/sales/InvoiceModal";
import InvoicePrintModal from "../../../components/sales/InvoicePrintModal";
import ClientModal from "../../../components/sales/ClientModal";

export default function SalesPage() {
  const {
    orders,
    clients,
    accounts,
    deleteOrder,
    updatePaymentStatus,
    updateOrderStatus,
    deleteClient,
  } = useFinance();

  const [activeTab, setActiveTab] = useState("invoices"); // 'invoices' | 'clients'
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientToEdit, setClientToEdit] = useState(null);

  // Perhitungan ringkas penjualan
  const totalSalesRevenue = orders
    .filter((o) => o.status !== "Dibatalkan")
    .reduce((sum, o) => sum + (o.grandTotal || 0), 0);

  const totalUnpaid = orders
    .filter((o) => o.paymentStatus !== "Lunas" && o.status !== "Dibatalkan")
    .reduce((sum, o) => sum + (o.grandTotal || 0), 0);

  const totalPaid = orders
    .filter((o) => o.paymentStatus === "Lunas")
    .reduce((sum, o) => sum + (o.grandTotal || 0), 0);

  const handleMarkAsPaid = (order) => {
    const primaryAccount = accounts[0]?.id;
    if (!primaryAccount) {
      alert("Buat atau pilih rekening kas/bank terlebih dahulu.");
      return;
    }
    if (confirm(`Tandai Invoice ${order.invoiceNumber} sebagai LUNAS dan catat pemasukan otomatis?`)) {
      updatePaymentStatus(order.id, "Lunas", primaryAccount);
    }
  };

  return (
    <div className="sales-page">
      {/* Top Header & Tab Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 700 }}>Penjualan, Invoice &amp; Klien</h2>
          <p style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
            Kelola transaksi penjualan barang/jasa, piutang invoice, serta basis data pelanggan.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          {activeTab === "invoices" ? (
            <button
              type="button"
              className="btn-primary"
              onClick={() => setShowInvoiceModal(true)}
            >
              <Plus size={16} /> Buat Invoice Baru
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setClientToEdit(null);
                setShowClientModal(true);
              }}
            >
              <Plus size={16} /> Tambah Klien Baru
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid-3" style={{ marginBottom: "24px" }}>
        <div className="stat-card stat-card-emerald" style={{ padding: "16px 20px" }}>
          <span className="stat-card-title">Total Omset Penjualan</span>
          <div className="stat-card-value text-emerald">{formatRp(totalSalesRevenue)}</div>
          <span className="stat-card-sub">{orders.length} pesanan terbit</span>
        </div>

        <div className="stat-card stat-card-blue" style={{ padding: "16px 20px" }}>
          <span className="stat-card-title">Sudah Dilunasi (Diterima)</span>
          <div className="stat-card-value">{formatRp(totalPaid)}</div>
          <span className="stat-card-sub">Tercatat di akun kas/bank</span>
        </div>

        <div className="stat-card stat-card-rose" style={{ padding: "16px 20px" }}>
          <span className="stat-card-title">Piutang Belum Dibayar</span>
          <div className="stat-card-value text-rose">{formatRp(totalUnpaid)}</div>
          <span className="stat-card-sub">Menunggu pelunasan klien</span>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "12px" }}>
        <button
          type="button"
          className={`btn-secondary btn-sm ${activeTab === "invoices" ? "btn-primary" : ""}`}
          onClick={() => setActiveTab("invoices")}
        >
          <FileText size={15} /> Daftar Invoice &amp; Order ({orders.length})
        </button>

        <button
          type="button"
          className={`btn-secondary btn-sm ${activeTab === "clients" ? "btn-primary" : ""}`}
          onClick={() => setActiveTab("clients")}
        >
          <Users size={15} /> Database Klien ({clients.length})
        </button>
      </div>

      {/* TAB 1: INVOICES */}
      {activeTab === "invoices" && (
        <div className="panel-card" style={{ padding: 0 }}>
          <div className="table-responsive">
            <table className="app-table">
              <thead>
                <tr>
                  <th>No. Invoice</th>
                  <th>Tanggal</th>
                  <th>Nama Klien</th>
                  <th>Status Order</th>
                  <th>Status Bayar</th>
                  <th style={{ textAlign: "right" }}>Total Tagihan</th>
                  <th style={{ width: "120px", textAlign: "center" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "36px", color: "var(--text-muted)" }}>
                      Belum ada invoice pesanan yang dibuat. Klik &quot;Buat Invoice Baru&quot; untuk memulai.
                    </td>
                  </tr>
                ) : (
                  orders.map((ord) => (
                    <tr key={ord.id}>
                      <td>
                        <strong>{ord.invoiceNumber}</strong>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          {ord.items?.length || 1} produk
                        </div>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>{formatDate(ord.date)}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{ord.clientName}</div>
                      </td>
                      <td>
                        <select
                          value={ord.status}
                          onChange={(e) => updateOrderStatus(ord.id, e.target.value)}
                          style={{
                            padding: "3px 8px",
                            fontSize: "12px",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--border-strong)",
                          }}
                        >
                          <option value="Baru">Baru</option>
                          <option value="Diproses">Diproses</option>
                          <option value="Selesai">Selesai</option>
                          <option value="Dibatalkan">Dibatalkan</option>
                        </select>
                      </td>
                      <td>
                        <Badge variant={ord.paymentStatus === "Lunas" ? "emerald" : "rose"} size="sm">
                          {ord.paymentStatus}
                        </Badge>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span className="num-cell" style={{ fontWeight: 700, fontSize: "14px" }}>
                          {formatRp(ord.grandTotal)}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                          {ord.paymentStatus !== "Lunas" && ord.status !== "Dibatalkan" && (
                            <button
                              type="button"
                              className="icon-edit-btn text-emerald"
                              onClick={() => handleMarkAsPaid(ord)}
                              title="Tandai Lunas"
                            >
                              <CheckCircle2 size={16} />
                            </button>
                          )}
                          <button
                            type="button"
                            className="icon-edit-btn"
                            onClick={() => setSelectedOrderForPrint(ord)}
                            title="Cetak Invoice"
                          >
                            <Printer size={16} />
                          </button>
                          <button
                            type="button"
                            className="icon-del-btn"
                            onClick={() => {
                              if (confirm(`Hapus invoice ${ord.invoiceNumber} dan kembalikan stok produk?`)) {
                                deleteOrder(ord.id);
                              }
                            }}
                            title="Hapus Invoice"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CLIENTS */}
      {activeTab === "clients" && (
        <div className="panel-card" style={{ padding: 0 }}>
          <div className="table-responsive">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Nama Perusahaan / Klien</th>
                  <th>Kontak PIC</th>
                  <th>Telepon / WA</th>
                  <th>Alamat Email</th>
                  <th>Alamat Kantor</th>
                  <th style={{ width: "80px", textAlign: "center" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {clients.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "36px", color: "var(--text-muted)" }}>
                      Belum ada database klien. Klik &quot;Tambah Klien Baru&quot; untuk menambahkan pelanggan.
                    </td>
                  </tr>
                ) : (
                  clients.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <strong>{c.name}</strong>
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>{c.contact || "—"}</td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px" }}>{c.phone || "—"}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{c.email || "—"}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{c.address || "—"}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                          <button
                            type="button"
                            className="icon-edit-btn"
                            onClick={() => {
                              setClientToEdit(c);
                              setShowClientModal(true);
                            }}
                            title="Edit Klien"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            className="icon-del-btn"
                            onClick={() => {
                              if (confirm(`Hapus klien "${c.name}"?`)) {
                                deleteClient(c.id);
                              }
                            }}
                            title="Hapus Klien"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showInvoiceModal && (
        <InvoiceModal
          isOpen={true}
          onClose={() => setShowInvoiceModal(false)}
        />
      )}

      {selectedOrderForPrint && (
        <InvoicePrintModal
          isOpen={true}
          order={selectedOrderForPrint}
          onClose={() => setSelectedOrderForPrint(null)}
        />
      )}

      {showClientModal && (
        <ClientModal
          isOpen={true}
          clientToEdit={clientToEdit}
          onClose={() => {
            setShowClientModal(false);
            setClientToEdit(null);
          }}
        />
      )}
    </div>
  );
}
