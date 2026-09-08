import "./globals.css";

export const metadata = {
  title: "ZENTA | Manajemen Bisnis",
  description: "Workspace keuangan, penjualan, inventori, dan payroll untuk bisnis yang lebih tertata.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
