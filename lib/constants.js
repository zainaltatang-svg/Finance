export const ACCOUNT_TYPES = [
  { id: "Cash", label: "Kas Laci Toko (Tunai)", icon: "Wallet" },
  { id: "E-Wallet", label: "QRIS / Dompet Digital", icon: "Smartphone" },
  { id: "Bank", label: "Rekening Bank (Kulakan)", icon: "Landmark" },
  { id: "Giro", label: "Rekening Giro", icon: "Building2" },
  { id: "Kartu Kredit", label: "Kartu Kredit / PayLater", icon: "CreditCard" },
];

export const INCOME_CATEGORIES = [
  "Penjualan Eceran Harian Warung",
  "Pelunasan Kasbon Pelanggan",
  "Jasa Titip / Token Listrik & Pulsa",
  "Pendapatan Lain-lain",
];

export const EXPENSE_CATEGORIES = [
  "Belanja Kulakan Pasar / Agen Grosir",
  "Beli Gas Elpiji & Galon Refill",
  "Token Listrik & Air Warung",
  "Plastik Kresek & Perlengkapan Warung",
  "Gaji / Uang Makan Penjaga Warung",
  "Iuran RT / Kebersihan / Keamanan",
  "Sewa Tempat / Kios Warung",
  "Pengeluaran Lain-lain",
];

export const WARUNG_CATEGORIES = [
  "Sembako & Beras",
  "Mie & Makanan Ringan",
  "Kopi & Minuman",
  "Rokok & Tembakau",
  "Sabun & Rumah Tangga",
  "Gas Elpiji & Galon",
  "Bumbu Dapur & Penyedap",
  "Pulsa, Listrik & Agen",
  "Produk Lainnya",
];

export const WARUNG_UNITS = [
  { value: "pcs", label: "Pcs (Satuan)" },
  { value: "kg", label: "Kg (Kilogram)" },
  { value: "liter", label: "Liter" },
  { value: "bks", label: "Bungkus (Bks)" },
  { value: "renceng", label: "Renceng (Sachet)" },
  { value: "butir", label: "Butir (Telur)" },
  { value: "dus", label: "Dus / Karton" },
  { value: "slop", label: "Slop (Rokok)" },
  { value: "tabung", label: "Tabung (Gas)" },
  { value: "galon", label: "Galon (Air)" },
  { value: "karung", label: "Karung (Beras)" },
  { value: "pack", label: "Pack" },
];

export const ORDER_STATUS = [
  { id: "Baru", label: "Baru / Pesan", color: "blue" },
  { id: "Diproses", label: "Diproses / Disiapkan", color: "amber" },
  { id: "Selesai", label: "Selesai", color: "emerald" },
  { id: "Dibatalkan", label: "Dibatalkan", color: "rose" },
];

export const PAYMENT_STATUS = [
  { id: "Belum Dibayar", label: "Kasbon / Hutang", color: "rose" },
  { id: "Sebagian", label: "Dicicil Sebagian", color: "amber" },
  { id: "Lunas", label: "Lunas (Tunai/QRIS)", color: "emerald" },
];

export const ATTENDANCE_STATUS = [
  { id: "Hadir", label: "Hadir", color: "emerald" },
  { id: "Izin", label: "Izin", color: "blue" },
  { id: "Sakit", label: "Sakit", color: "amber" },
  { id: "Alpha", label: "Libur / Tidak Masuk", color: "rose" },
];

export const LOW_STOCK_THRESHOLD = 5;

export const DEFAULT_BUSINESS_PROFILE = {
  name: "Warung Kelontong Berkah",
  tagline: "Sembako Lengkap, Murah & Bersahabat",
  address: "Jl. Mawar No. 14 RT 03/RW 05, Kelurahan Sukamaju",
  phone: "0812-8888-9999",
  email: "warung.berkah@gmail.com",
  currency: "IDR",
};
