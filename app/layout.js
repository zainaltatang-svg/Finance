import "./globals.css";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export const metadata = {
  title: {
    default: "ZENTA | Aplikasi Manajemen Bisnis & Keuangan",
    template: "%s | ZENTA Finance",
  },
  description:
    "Sistem cerdas all-in-one untuk manajemen keuangan, rekening bank, mutasi transaksi, inventori stok, penjualan invoice, dan payroll karyawan.",
  keywords: ["finance", "akuntansi", "kasir", "invoice", "payroll", "umkm", "manajemen bisnis"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
