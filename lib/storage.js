import { uid, todayISO } from "./formatters";
import { DEFAULT_BUSINESS_PROFILE } from "./constants";

export const STORAGE_KEY_V2 = "zenta_business_data_v2";

// Kunci lama untuk backwards compatibility
const OLD_FIN_KEY = "zenta-finance-v1";
const OLD_SALES_KEY = "zenta-sales-v1";
const OLD_HR_KEY = "zenta-hr-v1";

export const getInitialData = () => {
  const today = todayISO();

  const defaultAccounts = [
    { id: "acc-1", name: "Bank BCA Bisnis", type: "Bank", accountNumber: "8820-192-381", initialBalance: 25000000 },
    { id: "acc-2", name: "Kas Operasional", type: "Cash", accountNumber: "-", initialBalance: 3500000 },
    { id: "acc-3", name: "Dompet Digital (QRIS)", type: "E-Wallet", accountNumber: "0812-3456-7890", initialBalance: 1850000 },
  ];

  const defaultTransactions = [
    { id: "tx-1", type: "income", accountId: "acc-1", amount: 12500000, category: "Penjualan Produk", date: today, notes: "Order Paket Klien #1021" },
    { id: "tx-2", type: "income", accountId: "acc-3", amount: 1750000, category: "Pendapatan Jasa / Layanan", date: today, notes: "Konsultasi Setup Sistem" },
    { id: "tx-3", type: "expense", accountId: "acc-2", amount: 650000, category: "Operasional & Perlengkapan Kantor", date: today, notes: "Kertas printer & konsumsi kantor" },
    { id: "tx-4", type: "expense", accountId: "acc-1", amount: 2400000, category: "Beban Pokok Penjualan (HPP)", date: today, notes: "Restock material produksi" },
  ];

  const defaultTransfers = [
    { id: "tr-1", fromAccountId: "acc-1", toAccountId: "acc-2", amount: 1500000, date: today, notes: "Pengisian petty cash kasir" },
  ];

  const defaultClients = [
    { id: "cl-1", name: "PT Surya Abadi Sentosa", contact: "Bpk. Hendra", phone: "0812-8877-6655", email: "procurement@suryaabadi.co.id", address: "Jakarta Barat" },
    { id: "cl-2", name: "CV Mitra Digital Kreasi", contact: "Ibu Maya", phone: "0813-2233-4455", email: "finance@mitrakreasi.com", address: "Bandung" },
    { id: "cl-3", name: "Toko Berkah Sejahtera", contact: "Bpk. Rahmat", phone: "0819-7788-9900", email: "toko.berkah@gmail.com", address: "Surabaya" },
  ];

  const defaultProducts = [
    { id: "pr-1", name: "Paket Hardware Terminal POS", sku: "POS-TRM-01", costPrice: 1800000, price: 3200000, stock: 12, minStock: 3 },
    { id: "pr-2", name: "Printer Thermal Bluetooth 80mm", sku: "PRN-TH-80", costPrice: 280000, price: 550000, stock: 4, minStock: 5 }, // Stok rendah
    { id: "pr-3", name: "Barcode Scanner 2D Wireless", sku: "SCN-2D-WL", costPrice: 350000, price: 720000, stock: 18, minStock: 5 },
    { id: "pr-4", name: "Kertas Roll Thermal 80x80 (Dus/50)", sku: "ROL-8080", costPrice: 190000, price: 295000, stock: 25, minStock: 8 },
  ];

  const defaultOrders = [
    {
      id: "ord-1",
      invoiceNumber: "INV-2026-001",
      clientId: "cl-1",
      clientName: "PT Surya Abadi Sentosa",
      date: today,
      dueDate: today,
      status: "Selesai",
      paymentStatus: "Lunas",
      paidAccountId: "acc-1",
      discount: 0,
      notes: "Pengiriman via kurir internal ZENTA",
      items: [
        { productId: "pr-1", productName: "Paket Hardware Terminal POS", qty: 2, price: 3200000, total: 6400000 },
        { productId: "pr-3", productName: "Barcode Scanner 2D Wireless", qty: 2, price: 720000, total: 1440000 },
      ],
      subtotal: 7840000,
      grandTotal: 7840000,
    },
    {
      id: "ord-2",
      invoiceNumber: "INV-2026-002",
      clientId: "cl-2",
      clientName: "CV Mitra Digital Kreasi",
      date: today,
      dueDate: today,
      status: "Diproses",
      paymentStatus: "Belum Dibayar",
      paidAccountId: null,
      discount: 0,
      notes: "Jatuh tempo 14 hari kerja",
      items: [
        { productId: "pr-2", productName: "Printer Thermal Bluetooth 80mm", qty: 3, price: 550000, total: 1650000 },
      ],
      subtotal: 1650000,
      grandTotal: 1650000,
    },
  ];

  const defaultEmployees = [
    { id: "emp-1", name: "Andi Saputra", position: "Supervisor Operasional", phone: "0812-3344-5566", baseSalary: 6500000, joinDate: "2024-01-15", status: "Aktif" },
    { id: "emp-2", name: "Dewi Lestari", position: "Staff Administrasi & Keuangan", phone: "0813-4455-6677", baseSalary: 4800000, joinDate: "2024-06-01", status: "Aktif" },
    { id: "emp-3", name: "Budi Santoso", position: "Teknisi & Pengiriman", phone: "0815-5566-7788", baseSalary: 4200000, joinDate: "2025-02-10", status: "Aktif" },
  ];

  const defaultAttendance = [
    { id: "att-1", employeeId: "emp-1", date: today, status: "Hadir", notes: "Tepat waktu (08:45)" },
    { id: "att-2", employeeId: "emp-2", date: today, status: "Hadir", notes: "Tepat waktu (08:50)" },
    { id: "att-3", employeeId: "emp-3", date: today, status: "Hadir", notes: "Dinas luar antar barang" },
  ];

  const defaultPayroll = [
    {
      id: "pay-1",
      employeeId: "emp-1",
      employeeName: "Andi Saputra",
      period: today.slice(0, 7),
      baseSalary: 6500000,
      allowance: 750000,
      deduction: 0,
      netSalary: 7250000,
      paymentDate: today,
      status: "Dibayar",
      accountId: "acc-1",
      notes: "Gaji pokok + tunjangan performa",
    },
  ];

  return {
    profile: DEFAULT_BUSINESS_PROFILE,
    accounts: defaultAccounts,
    transactions: defaultTransactions,
    transfers: defaultTransfers,
    clients: defaultClients,
    products: defaultProducts,
    orders: defaultOrders,
    employees: defaultEmployees,
    attendance: defaultAttendance,
    payroll: defaultPayroll,
  };
};

/**
 * Muat data dari localStorage dengan migrasi otomatis dari versi sebelumnya
 */
export const loadLocalData = () => {
  if (typeof window === "undefined") return getInitialData();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_V2);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.accounts)) {
        return {
          ...getInitialData(),
          ...parsed,
        };
      }
    }

    // Coba migrasikan dari struktur data lama jika ada
    const oldFin = window.localStorage.getItem(OLD_FIN_KEY);
    const oldSales = window.localStorage.getItem(OLD_SALES_KEY);
    const oldHr = window.localStorage.getItem(OLD_HR_KEY);

    if (oldFin || oldSales || oldHr) {
      const initial = getInitialData();
      let migratedAccounts = initial.accounts;
      let migratedTransactions = initial.transactions;
      let migratedClients = initial.clients;
      let migratedProducts = initial.products;
      let migratedOrders = initial.orders;
      let migratedEmployees = initial.employees;
      let migratedAttendance = initial.attendance;
      let migratedPayroll = initial.payroll;

      if (oldFin) {
        try {
          const d = JSON.parse(oldFin);
          if (Array.isArray(d.accounts) && d.accounts.length > 0) {
            migratedAccounts = d.accounts.map((a) => ({
              id: a.id || uid(),
              name: a.nama || a.name || "Rekening",
              type: a.jenis || a.type || "Bank",
              accountNumber: a.nomor || a.accountNumber || "-",
              initialBalance: Number(a.saldoAwal || a.initialBalance || 0),
            }));
          }
          if (Array.isArray(d.incomes) || Array.isArray(d.expenses)) {
            const inc = (d.incomes || []).map((i) => ({
              id: i.id || uid(),
              type: "income",
              accountId: i.akun || i.accountId || (migratedAccounts[0]?.id || "acc-1"),
              amount: Number(i.jumlah || i.amount || 0),
              category: i.kategori || "Penjualan Produk",
              date: i.tanggal || i.date || todayISO(),
              notes: i.keterangan || i.notes || "",
            }));
            const exp = (d.expenses || []).map((e) => ({
              id: e.id || uid(),
              type: "expense",
              accountId: e.akun || e.accountId || (migratedAccounts[0]?.id || "acc-1"),
              amount: Number(e.jumlah || e.amount || 0),
              category: e.kategori || "Operasional & Perlengkapan Kantor",
              date: e.tanggal || e.date || todayISO(),
              notes: e.keterangan || e.notes || "",
            }));
            migratedTransactions = [...inc, ...exp];
          }
        } catch (e) {
          console.error("Gagal parse oldFin:", e);
        }
      }

      if (oldSales) {
        try {
          const d = JSON.parse(oldSales);
          if (Array.isArray(d.clients) && d.clients.length > 0) {
            migratedClients = d.clients.map((c) => ({
              id: c.id || uid(),
              name: c.nama || c.name || "Klien",
              contact: c.kontak || c.contact || "",
              phone: c.telepon || c.phone || "",
              email: c.email || "",
              address: c.alamat || c.address || "",
            }));
          }
          if (Array.isArray(d.products) && d.products.length > 0) {
            migratedProducts = d.products.map((p) => ({
              id: p.id || uid(),
              name: p.nama || p.name || "Produk",
              sku: p.kode || p.sku || "",
              costPrice: Number(p.hargaBeli || p.costPrice || (p.harga ? p.harga * 0.7 : 0)),
              price: Number(p.harga || p.price || 0),
              stock: Number(p.stok || p.stock || 0),
              minStock: 5,
            }));
          }
        } catch (e) {
          console.error("Gagal parse oldSales:", e);
        }
      }

      if (oldHr) {
        try {
          const d = JSON.parse(oldHr);
          if (Array.isArray(d.employees) && d.employees.length > 0) {
            migratedEmployees = d.employees.map((e) => ({
              id: e.id || uid(),
              name: e.nama || e.name || "Karyawan",
              position: e.jabatan || e.position || "",
              phone: e.telepon || e.phone || "",
              baseSalary: Number(e.gajiPokok || e.baseSalary || 0),
              joinDate: e.tglMasuk || e.joinDate || todayISO(),
              status: "Aktif",
            }));
          }
        } catch (e) {
          console.error("Gagal parse oldHr:", e);
        }
      }

      const merged = {
        ...initial,
        accounts: migratedAccounts,
        transactions: migratedTransactions,
        clients: migratedClients,
        products: migratedProducts,
        orders: migratedOrders,
        employees: migratedEmployees,
        attendance: migratedAttendance,
        payroll: migratedPayroll,
      };

      // Simpan ke storage v2
      window.localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(merged));
      return merged;
    }
  } catch (err) {
    console.error("Gagal memuat data dari storage:", err);
  }

  return getInitialData();
};

export const saveLocalData = (data) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(data));
  } catch (err) {
    console.error("Gagal menyimpan data ke localStorage:", err);
  }
};

export const exportDataToJSON = (data) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `zenta-finance-backup-${todayISO()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportTransactionsToCSV = (transactions = [], accounts = []) => {
  const getAccountName = (id) => accounts.find((a) => a.id === id)?.name || id;

  const headers = ["ID", "Tanggal", "Tipe", "Rekening", "Kategori", "Jumlah (IDR)", "Keterangan"];
  const rows = transactions.map((t) => [
    t.id,
    t.date,
    t.type === "income" ? "Pemasukan" : "Pengeluaran",
    `"${getAccountName(t.accountId).replace(/"/g, '""')}"`,
    `"${(t.category || "").replace(/"/g, '""')}"`,
    t.amount,
    `"${(t.notes || "").replace(/"/g, '""')}"`,
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `laporan-transaksi-${todayISO()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
