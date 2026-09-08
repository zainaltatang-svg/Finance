export const ACCOUNT_TYPES = [
  { id: "Cash", label: "Kas Tunai", icon: "Wallet" },
  { id: "Bank", label: "Rekening Bank", icon: "Landmark" },
  { id: "Giro", label: "Rekening Giro", icon: "Building2" },
  { id: "E-Wallet", label: "Dompet Digital (E-Wallet)", icon: "Smartphone" },
  { id: "Kartu Kredit", label: "Kartu Kredit", icon: "CreditCard" },
];

export const INCOME_CATEGORIES = [
  "Penjualan Produk",
  "Pendapatan Jasa / Layanan",
  "Investasi & Bunga",
  "Pelunasan Piutang",
  "Refund / Pengembalian",
  "Pendapatan Lain-lain",
];

export const EXPENSE_CATEGORIES = [
  "Beban Pokok Penjualan (HPP)",
  "Gaji & Upah Karyawan",
  "Sewa & Utilitas (Listrik/Air/Internet)",
  "Pemasaran & Iklan",
  "Operasional & Perlengkapan Kantor",
  "Pajak & Retribusi",
  "Biaya Admin & Bank",
  "Pemeliharaan & Aset",
  "Pengeluaran Lain-lain",
];

export const ORDER_STATUS = [
  { id: "Baru", label: "Baru / Draft", color: "blue" },
  { id: "Diproses", label: "Sedang Diproses", color: "amber" },
  { id: "Selesai", label: "Selesai", color: "emerald" },
  { id: "Dibatalkan", label: "Dibatalkan", color: "rose" },
];

export const PAYMENT_STATUS = [
  { id: "Belum Dibayar", label: "Belum Dibayar", color: "rose" },
  { id: "Sebagian", label: "Dibayar Sebagian", color: "amber" },
  { id: "Lunas", label: "Lunas", color: "emerald" },
];

export const ATTENDANCE_STATUS = [
  { id: "Hadir", label: "Hadir", color: "emerald" },
  { id: "Izin", label: "Izin", color: "blue" },
  { id: "Sakit", label: "Sakit", color: "amber" },
  { id: "Alpha", label: "Alpha / Tanpa Keterangan", color: "rose" },
];

export const LOW_STOCK_THRESHOLD = 5;

export const DEFAULT_BUSINESS_PROFILE = {
  name: "ZENTA Business",
  tagline: "Solusi Manajemen Bisnis Terintegrasi",
  address: "Jl. Sudirman No. 128, Jakarta Pusat",
  phone: "+62 812-3456-7890",
  email: "finance@zentabusiness.id",
  currency: "IDR",
};
