import { uid, todayISO } from "./formatters";
import { DEFAULT_BUSINESS_PROFILE } from "./constants";

export const STORAGE_KEY_V2 = "zenta_business_data_v2";

export const getUserStorageKey = (userId) => {
  return userId ? `zenta_user_data_${userId}` : STORAGE_KEY_V2;
};

export const getBlankData = (customProfile = null) => ({
  profile: customProfile || DEFAULT_BUSINESS_PROFILE,
  accounts: [],
  transactions: [],
  transfers: [],
  clients: [],
  products: [],
  orders: [],
  employees: [],
  attendance: [],
  payroll: [],
});

// Kunci lama untuk backwards compatibility
const OLD_FIN_KEY = "zenta-finance-v1";
const OLD_SALES_KEY = "zenta-sales-v1";
const OLD_HR_KEY = "zenta-hr-v1";

export const getInitialData = () => {
  const today = todayISO();

  const defaultAccounts = [
    { id: "acc-1", name: "Kas Laci Toko (Tunai)", type: "Cash", accountNumber: "Laci Kasir", initialBalance: 1500000 },
    { id: "acc-2", name: "QRIS Warung (Gopay/Dana)", type: "E-Wallet", accountNumber: "0812-8888-9999", initialBalance: 650000 },
    { id: "acc-3", name: "Bank BRI (Rekening Kulakan)", type: "Bank", accountNumber: "0192-01-002841-50-2", initialBalance: 8500000 },
  ];

  const defaultTransactions = [
    { id: "tx-1", type: "income", accountId: "acc-1", amount: 485000, category: "Penjualan Eceran Harian Warung", date: today, notes: "Total omset penjualan tunai pagi" },
    { id: "tx-2", type: "income", accountId: "acc-2", amount: 125000, category: "Penjualan Eceran Harian Warung", date: today, notes: "Pembayaran via scan QRIS warung" },
    { id: "tx-3", type: "expense", accountId: "acc-3", amount: 2450000, category: "Belanja Kulakan Pasar / Agen Grosir", date: today, notes: "Kulakan beras, minyak & mie ke agen grosir" },
    { id: "tx-4", type: "expense", accountId: "acc-1", amount: 95000, category: "Beli Gas Elpiji & Galon Refill", date: today, notes: "Tukar 5 tabung gas melon 3kg ke pangkalan" },
    { id: "tx-5", type: "expense", accountId: "acc-1", amount: 35000, category: "Plastik Kresek & Perlengkapan Warung", date: today, notes: "Plastik kresek & sedotan" },
  ];

  const defaultTransfers = [
    { id: "tr-1", fromAccountId: "acc-3", toAccountId: "acc-1", amount: 500000, date: today, notes: "Tarik tunai untuk tambahan uang kembalian laci" },
  ];

  const defaultClients = [
    { id: "cl-1", name: "Bu RT Endang (No. 04)", contact: "Bu Endang", phone: "0812-3344-5566", email: "", address: "RT 03/RW 05 Rumah No. 04" },
    { id: "cl-2", name: "Pak Joko (Bengkel Depan)", contact: "Pak Joko", phone: "0813-7788-9900", email: "", address: "Jl. Mawar Depan Pos Ronda" },
    { id: "cl-3", name: "Mbak Siti (Warung Kopi No. 09)", contact: "Mbak Siti", phone: "0819-2233-4411", email: "", address: "RT 03/RW 05 No. 09" },
  ];

  const defaultProducts = [
    { id: "pr-1", name: "Beras Ramos Setra 5kg", sku: "BRS-5KG", costPrice: 65000, price: 74000, stock: 16, minStock: 4, unit: "karung", category: "Sembako & Beras", type: "product" },
    { id: "pr-2", name: "Minyak Goreng Bimoli 2L", sku: "MYK-2L", costPrice: 32000, price: 36500, stock: 22, minStock: 6, unit: "pouch", category: "Sembako & Beras", type: "product" },
    { id: "pr-3", name: "Telur Ayam Negeri (1 Kg)", sku: "TLR-1KG", costPrice: 26000, price: 29000, stock: 28, minStock: 8, unit: "kg", category: "Sembako & Beras", type: "product" },
    { id: "pr-4", name: "Gula Pasir Gulaku 1kg", sku: "GLA-1KG", costPrice: 16500, price: 18500, stock: 20, minStock: 5, unit: "bks", category: "Sembako & Beras", type: "product" },
    { id: "pr-5", name: "Indomie Goreng Spesial", sku: "MIE-IDM-GR", costPrice: 2800, price: 3500, stock: 96, minStock: 24, unit: "bks", category: "Mie & Makanan Ringan", type: "product" },
    { id: "pr-6", name: "Kopi Kapal Api Mix (1 Renceng)", sku: "KPI-KPL-RNC", costPrice: 12500, price: 15000, stock: 14, minStock: 4, unit: "renceng", category: "Kopi & Minuman", type: "product" },
    { id: "pr-7", name: "Gas Elpiji 3kg (Melon)", sku: "GAS-3KG", costPrice: 19000, price: 22000, stock: 2, minStock: 5, unit: "tabung", category: "Gas Elpiji & Galon", type: "product" }, // Stok menipis
    { id: "pr-8", name: "Air Galon Aqua 19L (Tukar)", sku: "GLN-AQU-19", costPrice: 18000, price: 21000, stock: 12, minStock: 4, unit: "galon", category: "Gas Elpiji & Galon", type: "product" },
    { id: "pr-9", name: "Sabun Cuci Piring Sunlight 750ml", sku: "SBN-SNL-750", costPrice: 13000, price: 15500, stock: 10, minStock: 3, unit: "pouch", category: "Sabun & Rumah Tangga", type: "product" },
    { id: "pr-10", name: "Rokok Sampoerna Mild 16", sku: "RKK-SMP-16", costPrice: 31500, price: 34000, stock: 12, minStock: 4, unit: "bks", category: "Rokok & Tembakau", type: "product" },
  ];

  const defaultOrders = [
    {
      id: "ord-1",
      invoiceNumber: "WRG-2026-001",
      clientId: null,
      clientName: "Pembeli Tunai (Eceran)",
      clientAddress: "-",
      date: today,
      dueDate: today,
      status: "Selesai",
      paymentStatus: "Lunas",
      paidAccountId: "acc-1",
      discount: 0,
      notes: "Belanja sembako tunai lunas",
      items: [
        { productId: "pr-2", productName: "Minyak Goreng Bimoli 2L", qty: 1, price: 36500, total: 36500 },
        { productId: "pr-3", productName: "Telur Ayam Negeri (1 Kg)", qty: 2, price: 29000, total: 58000 },
        { productId: "pr-5", productName: "Indomie Goreng Spesial", qty: 5, price: 3500, total: 17500 },
      ],
      subtotal: 112000,
      grandTotal: 112000,
    },
    {
      id: "ord-2",
      invoiceNumber: "WRG-2026-002",
      clientId: "cl-1",
      clientName: "Bu RT Endang (No. 04)",
      clientAddress: "RT 03/RW 05 Rumah No. 04",
      date: today,
      dueDate: today,
      status: "Diproses",
      paymentStatus: "Belum Dibayar",
      paidAccountId: null,
      discount: 0,
      notes: "Kasbon mingguan Bu RT, rencana lunas hari Sabtu",
      items: [
        { productId: "pr-1", productName: "Beras Ramos Setra 5kg", qty: 1, price: 74000, total: 74000 },
        { productId: "pr-7", productName: "Gas Elpiji 3kg (Melon)", qty: 1, price: 22000, total: 22000 },
      ],
      subtotal: 96000,
      grandTotal: 96000,
    },
  ];

  const defaultEmployees = [
    { id: "emp-1", name: "Mas Dimas", position: "Penjaga Warung (Shift Pagi)", phone: "0812-1122-3344", baseSalary: 1800000, joinDate: "2024-03-01", status: "Aktif" },
    { id: "emp-2", name: "Mbak Rini", position: "Penjaga Warung (Shift Sore)", phone: "0813-2233-5566", baseSalary: 1800000, joinDate: "2024-07-15", status: "Aktif" },
  ];

  const defaultAttendance = [
    { id: "att-1", employeeId: "emp-1", date: today, status: "Hadir", notes: "Jaga warung buka jam 07:00" },
    { id: "att-2", employeeId: "emp-2", date: today, status: "Hadir", notes: "Jaga warung buka jam 15:00" },
  ];

  const defaultPayroll = [
    {
      id: "pay-1",
      employeeId: "emp-1",
      employeeName: "Mas Dimas",
      period: today.slice(0, 7),
      baseSalary: 1800000,
      allowance: 200000,
      deduction: 0,
      netSalary: 2000000,
      paymentDate: today,
      status: "Dibayar",
      accountId: "acc-1",
      notes: "Gaji bulanan + uang makan",
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
export const loadLocalData = (userId = null) => {
  if (typeof window === "undefined") return userId ? getBlankData() : getInitialData();

  const key = getUserStorageKey(userId);

  try {
    const raw = window.localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.accounts)) {
        return {
          ...(userId ? getBlankData() : getInitialData()),
          ...parsed,
        };
      }
    }

    if (userId) {
      // Jika pengguna login tapi belum ada cache khusus, mulai dengan blank data
      return getBlankData();
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

export const saveLocalData = (data, userId = null) => {
  if (typeof window === "undefined") return;
  const key = getUserStorageKey(userId);
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
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
