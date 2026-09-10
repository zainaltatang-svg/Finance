"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Printer, Trash2, Edit2, CheckCircle2, Users, FileText, Search, ChevronLeft, ChevronRight, Loader2, Share2, Receipt } from "lucide-react";
import { useFinance } from "../../../context/FinanceContext";
import { useToast } from "../../../components/ui/Toast";
import { useConfirm } from "../../../components/ui/ConfirmModal";
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

  const toast = useToast();
  const { confirm } = useConfirm();

  const [activeTab, setActiveTab] = useState("invoices"); // 'invoices' | 'kasbon' | 'clients'
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientToEdit, setClientToEdit] = useState(null);

  // Search & Pagination states
  const [searchOrder, setSearchOrder] = useState("");
  const [filterPayment, setFilterPayment] = useState("all");
  const [currentOrderPage, setCurrentOrderPage] = useState(1);
  const orderPageSize = 10;

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      if (activeTab === "kasbon" && ord.paymentStatus === "Lunas") return false;
      if (filterPayment !== "all" && ord.paymentStatus !== filterPayment) return false;

      if (searchOrder.trim()) {
        const q = searchOrder.toLowerCase();
        const invMatch = ord.invoiceNumber?.toLowerCase().includes(q);
        const clientMatch = ord.clientName?.toLowerCase().includes(q);
        const amountMatch = String(ord.grandTotal).includes(q);
        if (!invMatch && !clientMatch && !amountMatch) return false;
      }
      return true;
    });
  }, [orders, searchOrder, filterPayment, activeTab]);

  const [prevFilter, setPrevFilter] = useState({ search: searchOrder, payment: filterPayment, tab: activeTab });
  if (prevFilter.search !== searchOrder || prevFilter.payment !== filterPayment || prevFilter.tab !== activeTab) {
    setPrevFilter({ search: searchOrder, payment: filterPayment, tab: activeTab });
    setCurrentOrderPage(1);
  }

  const totalOrderPages = Math.max(1, Math.ceil(filteredOrders.length / orderPageSize));
  const paginatedOrders = useMemo(() => {
    const start = (currentOrderPage - 1) * orderPageSize;
    return filteredOrders.slice(start, start + orderPageSize);
  }, [filteredOrders, currentOrderPage, orderPageSize]);

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

  const [processingOrderId, setProcessingOrderId] = useState(null);

  const handleMarkAsPaid = async (order) => {
    const primaryAccount = accounts[0]?.id;
    if (!primaryAccount) {
      toast.warning("Buat atau pilih rekening kas/bank terlebih dahulu di menu Rekening.");
      return;
    }

    const isConfirmed = await confirm({
      title: "Pelunasan Invoice",
      message: `Tandai Invoice ${order.invoiceNumber} senilai ${formatRp(order.grandTotal)} sebagai LUNAS dan catat mutasi pemasukan otomatis?`,
      confirmText: "Tandai Lunas",
      cancelText: "Batal",
      danger: false,
    });

    if (isConfirmed) {
      setProcessingOrderId(order.id);
      try {
        await updatePaymentStatus(order.id, "Lunas", primaryAccount);
        toast.success(`Invoice ${order.invoiceNumber} berhasil dilunasi.`);
      } catch (err) {
        console.error(err);
        toast.error(err.message || "Gagal memproses pelunasan invoice.");
      } finally {
        setProcessingOrderId(null);
      }
    }
  };

  const handleDeleteOrder = async (ord) => {
    const isConfirmed = await confirm({
      title: "Hapus Invoice",
      message: `Hapus invoice ${ord.invoiceNumber} senilai ${formatRp(ord.grandTotal)}? Stok produk akan dikembalikan otomatis.`,
      confirmText: "Hapus Invoice",
      cancelText: "Batal",
      danger: true,
    });

    if (isConfirmed) {
      try {
        await deleteOrder(ord.id);
        toast.success(`Invoice ${ord.invoiceNumber} telah dihapus.`);
      } catch (err) {
        console.error(err);
        toast.error(err.message || "Gagal menghapus invoice.");
      }
    }
  };

  const handleDeleteClient = async (c) => {
    const isConfirmed = await confirm({
      title: "Hapus Klien",
      message: `Hapus klien "${c.name}" dari direktori?`,
      confirmText: "Hapus Klien",
      cancelText: "Batal",
      danger: true,
    });

    if (isConfirmed) {
      try {
        await deleteClient(c.id);
        toast.success(`Klien "${c.name}" berhasil dihapus.`);
      } catch (err) {
        console.error(err);
        toast.error(err.message || "Gagal menghapus klien.");
      }
    }
  };

  const handleShareOrderWA = (ord) => {
    const client = clients.find((c) => c.id === ord.clientId);
    const phone = (client?.phone || "").replace(/[^0-9]/g, "");
    const formattedPhone = phone.startsWith("0") ? `62${phone.slice(1)}` : phone;
    const itemsText = ord.items?.map((it, idx) => `${idx + 1}. ${it.productName} (${it.qty}x) = ${formatRp(it.total)}`).join("\n") || "";

    const message = `*CATATAN KASBON WARUNG*
Pelanggan : *${ord.clientName}*
No. Struk : ${ord.invoiceNumber}
Tanggal   : ${formatDate(ord.date)}
${ord.dueDate ? `Rencana Lunas : ${formatDate(ord.dueDate)}\n` : ""}
*Rincian Belanjaan:*
${itemsText}
------------------------------------
Total Bon : *${formatRp(ord.grandTotal)}*
Status    : *BELUM LUNAS (KASBON)*

Pesan ini dikirim sebagai pengingat catatan belanja. Terima kasih! 🙏`;

    const url = formattedPhone
      ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="sales-page">
      {/* Page Header */}
      <div className="page-header-flex">
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 700 }}>Kasir &amp; Penjualan Warung</h2>
          <p style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
            Kelola transaksi kasir eceran, buku kasbon/hutang warung langganan, dan cetak struk nota belanja.
          </p>
        </div>

        <div className="page-header-actions">
          {activeTab === "clients" ? (
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setClientToEdit(null);
                setShowClientModal(true);
              }}
            >
              <Plus size={16} /> + Tambah Data Langganan
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary"
              onClick={() => setShowInvoiceModal(true)}
            >
              <Plus size={16} /> + Transaksi Kasir Baru
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid-3" style={{ marginBottom: "24px" }}>
        <div className="stat-card stat-card-emerald" style={{ padding: "16px 20px" }}>
          <span className="stat-card-title">Total Omzet Penjualan</span>
          <div className="stat-card-value text-emerald">{formatRp(totalSalesRevenue)}</div>
          <span className="stat-card-sub">Dari {orders.filter((o) => o.status !== "Dibatalkan").length} transaksi belanja</span>
        </div>

        <div className="stat-card stat-card-blue" style={{ padding: "16px 20px" }}>
          <span className="stat-card-title">Uang Masuk Kas Laci (Lunas)</span>
          <div className="stat-card-value">{formatRp(totalPaid)}</div>
          <span className="stat-card-sub">Tunai / QRIS diterima</span>
        </div>

        <div className="stat-card stat-card-rose" style={{ padding: "16px 20px" }}>
          <span className="stat-card-title">Buku Kasbon Belum Lunas</span>
          <div className="stat-card-value text-rose">{formatRp(totalUnpaid)}</div>
          <span className="stat-card-sub">Hutang belanja warga/langganan</span>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="scrollable-tabs-bar" style={{ marginBottom: "20px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "12px" }}>
        <button
          type="button"
          className={`btn-secondary btn-sm ${activeTab === "invoices" ? "btn-primary" : ""}`}
          onClick={() => setActiveTab("invoices")}
        >
          <Receipt size={15} /> Semua Penjualan ({orders.length})
        </button>

        <button
          type="button"
          className={`btn-secondary btn-sm ${activeTab === "kasbon" ? "btn-primary" : ""}`}
          onClick={() => setActiveTab("kasbon")}
          style={
            activeTab === "kasbon"
              ? { backgroundColor: "var(--rose-primary)", borderColor: "var(--rose-primary)", color: "#fff" }
              : orders.filter((o) => o.paymentStatus !== "Lunas").length > 0
              ? { color: "var(--rose-primary)", borderColor: "var(--rose-border)" }
              : {}
          }
        >
          <FileText size={15} /> 📝 Buku Kasbon Warung ({orders.filter((o) => o.paymentStatus !== "Lunas").length})
        </button>

        <button
          type="button"
          className={`btn-secondary btn-sm ${activeTab === "clients" ? "btn-primary" : ""}`}
          onClick={() => setActiveTab("clients")}
        >
          <Users size={15} /> Buku Langganan / Warga ({clients.length})
        </button>
      </div>

      {/* TAB 1: INVOICES */}
      {activeTab === "invoices" && (
        <div className="panel-card" style={{ padding: 0 }}>
          {/* Toolbar filter invoice */}
          <div style={{ padding: "14px 18px", display: "flex", gap: "12px", borderBottom: "1px solid var(--border-subtle)", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
              <Search size={15} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Cari nomor invoice, klien, nominal..."
                value={searchOrder}
                onChange={(e) => setSearchOrder(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 12px 6px 32px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-strong)",
                  fontSize: "12.5px",
                }}
              />
            </div>

            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              style={{ padding: "6px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-strong)", fontSize: "12.5px" }}
            >
              <option value="all">Semua Status Bayar</option>
              <option value="Lunas">Lunas</option>
              <option value="Belum Dibayar">Belum Dibayar</option>
              <option value="Sebagian">Sebagian</option>
            </select>
          </div>

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
                {paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "36px", color: "var(--text-muted)" }}>
                      Tidak ada invoice yang sesuai dengan kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((ord) => (
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
                          onChange={(e) => {
                            updateOrderStatus(ord.id, e.target.value);
                            toast.info(`Status pesanan ${ord.invoiceNumber} diubah ke ${e.target.value}.`);
                          }}
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
                          {ord.paymentStatus !== "Lunas" && (
                            <>
                              <button
                                type="button"
                                className="icon-edit-btn"
                                style={{ color: "var(--emerald-primary)" }}
                                onClick={() => handleMarkAsPaid(ord)}
                                disabled={processingOrderId === ord.id}
                                title="Tandai Kasbon Lunas"
                              >
                                {processingOrderId === ord.id ? (
                                  <Loader2 className="animate-spin" size={16} />
                                ) : (
                                  <CheckCircle2 size={16} />
                                )}
                              </button>
                              <button
                                type="button"
                                className="icon-edit-btn"
                                style={{ color: "#16a34a" }}
                                onClick={() => handleShareOrderWA(ord)}
                                title="Kirim Rincian Bon ke WhatsApp"
                              >
                                <Share2 size={16} />
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            className="icon-edit-btn"
                            onClick={() => setSelectedOrderForPrint(ord)}
                            title="Cetak Struk / Nota"
                          >
                            <Printer size={16} />
                          </button>
                          <button
                            type="button"
                            className="icon-del-btn"
                            onClick={() => handleDeleteOrder(ord)}
                            title="Hapus Transaksi"
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

          {/* Pagination bar */}
          {filteredOrders.length > orderPageSize && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 18px",
                borderTop: "1px solid var(--border-subtle)",
                fontSize: "12.5px",
                color: "var(--text-secondary)",
              }}
            >
              <div>
                Menampilkan <strong>{Math.min(filteredOrders.length, (currentOrderPage - 1) * orderPageSize + 1)}</strong> -{" "}
                <strong>{Math.min(filteredOrders.length, currentOrderPage * orderPageSize)}</strong> dari{" "}
                <strong>{filteredOrders.length}</strong> invoice
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setCurrentOrderPage((p) => Math.max(1, p - 1))}
                  disabled={currentOrderPage === 1}
                  style={{ padding: "4px 8px" }}
                >
                  <ChevronLeft size={16} /> Sebelumnya
                </button>
                <span style={{ padding: "0 8px", fontWeight: 600 }}>
                  {currentOrderPage} / {totalOrderPages}
                </span>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setCurrentOrderPage((p) => Math.min(totalOrderPages, p + 1))}
                  disabled={currentOrderPage === totalOrderPages}
                  style={{ padding: "4px 8px" }}
                >
                  Berikutnya <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
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
                            onClick={() => handleDeleteClient(c)}
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

      {/* Modal Buat Invoice */}
      {showInvoiceModal && (
        <InvoiceModal
          isOpen={true}
          onClose={() => setShowInvoiceModal(false)}
        />
      )}

      {/* Modal Cetak PDF / Cetak Struk Invoice */}
      {selectedOrderForPrint && (
        <InvoicePrintModal
          isOpen={true}
          order={selectedOrderForPrint}
          onClose={() => setSelectedOrderForPrint(null)}
        />
      )}

      {/* Modal Tambah/Edit Klien */}
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
