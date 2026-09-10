# Task Flow & Checklist Pengembangan ZENTA Finance

Dokumen ini adalah panduan kerja (*action checklist*) pengerjaan refactoring dan pengembangan sistem **ZENTA Finance**. Checklist ini mencakup perbaikan skema database Supabase, proteksi rute & autentikasi, transisi ke cloud sync, refactoring arsitektur state, hingga peningkatan UX modern.

---

## 📊 Ringkasan Progress Pengerjaan

- [x] **Fase 1: Pembenahan Skema, Indexing & Optimasi RLS Supabase** (4/4 selesai)
- [x] **Fase 2: Proteksi Autentikasi & Route Guarding** (2/2 selesai)
- [x] **Fase 3: Integrasi Cloud Data Layer & Supabase Service** (5/5 selesai)
- [x] **Fase 4: Refactoring Modular State & Perbaikan Bug Kalkulasi/Timezone** (5/5 selesai)
- [x] **Fase 5: UI/UX Modernization, Toast Notification & Polish** (4/4 selesai)
- [x] **Fase 6: Integrasi Penuh Database Supabase Cloud (Cloud-First Sync)** (5/5 selesai)
- [x] **Fase 7: Fitur Jasa & Penyesuaian Katalog Produk & Jasa** (6/6 selesai)
- [x] **Fase 8: Perapihan & Standardisasi Tampilan Responsif Mobile (Multi-Device)** (7/7 selesai)
- [x] **Fase 9: Integritas Transaksi, Atomisitas & Kontrol Konkurensi (Audit P1: F01-F05)** (5/5 selesai)
- [ ] **Fase 10: Penguatan Autentikasi, Keamanan Sesi & Skema Database (Audit P1/P2: F09, F10, F16)** (0/3)
- [ ] **Fase 11: Validasi Cadangan, Pemulihan Data & Indikator Sinkronisasi (Audit P1/P2: F06, F07, F12, F17, F18)** (0/5)
- [ ] **Fase 12: Ketepatan Logika Finansial, Valuasi, Akuntansi & Keamanan Ekspor (Audit P1/P2: F11, F13, F14, F15, F19)** (0/5)
- [ ] **Fase 13: Optimasi Performa Lanjutan, Skalabilitas & Pengujian Kualitas (Audit P1/P2: F08 & Bagian 8-12)** (0/4)

---

## 🛠️ Detail Task & Checklist Pengerjaan

### 🔹 Fase 1: Pembenahan Skema, Indexing & Optimasi RLS Database Supabase
> **Tujuan**: Memastikan database PostgreSQL Supabase aman, memiliki performa tinggi, dan sinkron 100% dengan kebutuhan frontend.

- [x] **Task 1.1: Sinkronisasi Skema DDL ([supabase/schema.sql](file:///d:/Finance/supabase/schema.sql))**
  - [x] Tambahkan kolom `paid_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL` pada tabel `orders`.
  - [x] Tambahkan kolom `account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL` pada tabel `payroll`.
  - [x] Sinkronkan definisi tabel `order_items` di file lokal agar mencantumkan kolom `user_id UUID NOT NULL REFERENCES auth.users(id)`.
  - [x] Perbarui `schema.sql` agar menjadi sumber kebenaran tunggal (*single source of truth*) yang konsisten.

- [x] **Task 1.2: Optimasi Kinerja RLS Policies (Fix 11 Warning `auth_rls_initplan`)**
  - [x] Perbarui policy RLS pada tabel `profiles` dari `auth.uid() = id` menjadi `(select auth.uid()) = id`.
  - [x] Perbarui policy RLS pada tabel `accounts`, `transactions`, `transfers`, `clients`, `products`, `orders`, `order_items`, `employees`, `attendance`, dan `payroll` dari `auth.uid() = user_id` menjadi `(select auth.uid()) = user_id`.
  - [x] Mencegah pemanggilan ulang fungsi otentikasi pada setiap baris data (*per-row evaluation*) yang menurunkan performa query skala besar.

- [x] **Task 1.3: Penambahan Covering Indexes untuk Foreign Keys (Fix 6 Warning Linter)**
  - [x] Buat indeks `idx_attendance_employee_id` pada `public.attendance(employee_id)`.
  - [x] Buat indeks `idx_order_items_product_id` pada `public.order_items(product_id)`.
  - [x] Buat indeks `idx_orders_client_id` pada `public.orders(client_id)`.
  - [x] Buat indeks `idx_payroll_employee_id` pada `public.payroll(employee_id)`.
  - [x] Buat indeks `idx_transfers_from_account_id` pada `public.transfers(from_account_id)`.
  - [x] Buat indeks `idx_transfers_to_account_id` pada `public.transfers(to_account_id)`.

- [x] **Task 1.4: Eksekusi DDL & Verifikasi Linter via MCP**
  - [x] Terapkan seluruh perubahan skema DDL ke database Supabase cloud menggunakan MCP tool `execute_sql`.
  - [x] Jalankan audit `get_advisors` (security & performance) untuk memverifikasi 0 warnings pada RLS dan Foreign Keys.

---

### 🔹 Fase 2: Proteksi Autentikasi & Route Guarding
> **Tujuan**: Mencegah akses tidak sah ke dashboard dan memastikan sesi pengguna aman.

- [x] **Task 2.1: Implementasi Route Guard Middleware ([proxy.js](file:///d:/Finance/proxy.js))**
  - [x] Buat file `proxy.js` untuk memproteksi seluruh rute privat `/dashboard/:path*`.
  - [x] Cek status sesi pengguna melalui token autentikasi Supabase.
  - [x] Arahkan pengguna tanpa sesi aktif kembali ke halaman masuk (`/`).
  - [x] Arahkan otomatis pengguna yang sudah login saat mengakses `/` langsung ke `/dashboard`.

- [x] **Task 2.2: Penyempurnaan Halaman Masuk/Daftar ([app/page.js](file:///d:/Finance/app/page.js))**
  - [x] Periksa sesi aktif pada saat *initial mount*, jika sudah login segera alihkan ke dashboard.
  - [x] Sempurnakan penanganan pesan kesalahan login/registrasi agar informatif dan ramah pengguna.

- [x] **Task 2.3: Pembersihan Sesi & Logout Tuntas**
  - [x] Perbarui handler `handleLogout` di [Sidebar.jsx](file:///d:/Finance/components/layout/Sidebar.jsx) agar membersihkan sesi Supabase serta mereset *in-memory state* aplikasi.

---

### 🔹 Fase 3: Integrasi Cloud Data Layer & Supabase Service
> **Tujuan**: Mengubah aplikasi dari penyimpanan lokal semata (*localStorage demo*) menjadi sistem cloud multi-device yang tersinkronisasi penuh.

- [x] **Task 3.1: Arsitektur Repositori Layanan API ([lib/services/](file:///d:/Finance/lib/services))**
  - [x] Buat `lib/services/accountsService.js`: CRUD data rekening bank & kas.
  - [x] Buat `lib/services/transactionsService.js`: CRUD transaksi pemasukan, pengeluaran, dan transfer.
  - [x] Buat `lib/services/salesService.js`: CRUD invoice pesanan, item pesanan, dan direktori klien.
  - [x] Buat `lib/services/inventoryService.js`: CRUD katalog produk dan penyesuaian stok.
  - [x] Buat `lib/services/employeesService.js`: CRUD karyawan, catatan absensi harian, dan penggajian (payroll).
  - [x] Buat `lib/services/profileService.js`: Pengambilan dan pembaruan profil entitas bisnis.

- [x] **Task 3.2: Standardisasi UUID Generator ([lib/formatters.js](file:///d:/Finance/lib/formatters.js))**
  - [x] Pastikan fungsi `uid()` selalu menghasilkan format UUID v4 standard RFC4122 agar kompatibel dengan tipe data `UUID` PostgreSQL di Supabase.

- [x] **Task 3.3: Utilitas Migrasi Data Lokal ke Cloud (One-Time Cloud Sync)**
  - [x] Buat fungsi pembaca data yang ada di `localStorage` (`zenta_business_data_v2`).
  - [x] Transformasikan ID non-UUID (seperti `acc-1`, `tx-1`) menjadi UUID valid dengan memetakan seluruh relasi antar tabel (misal: `accountId` transaksi disesuaikan dengan ID baru rekening).
  - [x] Tambahkan tombol "Sinkronkan Data Lokal ke Cloud" pada [settings/page.js](file:///d:/Finance/app/dashboard/settings/page.js).

- [x] **Task 3.4: Reaktivitas State Provider dengan Database Cloud**
  - [x] Modifikasi `FinanceContext` untuk memuat data dari Supabase saat user berhasil login.
  - [x] Implementasikan strategi *Optimistic UI Update* agar interaksi UI tetap cepat dan responsif saat menyimpan ke database cloud.

- [x] **Task 3.5: Caching & Fallback Offline**
  - [x] Simpan salinan data terakhir ke `localStorage` sebagai cache offline jika sewaktu-waktu koneksi jaringan terputus.

---

### 🔹 Fase 4: Refactoring Modular State & Perbaikan Bug Kalkulasi/Timezone
> **Tujuan**: Mengeliminasi bottleneck re-rendering, memperbaiki bug kalkulasi tanggal, dan meningkatkan stabilitas komputasi finansial.

- [x] **Task 4.1: Pemecahan Monolithic Context ([context/FinanceContext.js](file:///d:/Finance/context/FinanceContext.js))**
  - [x] Pecah context 530+ baris menjadi sub-hooks/providers spesifik domain (`useAccounts`, `useTransactions`, `useInventory`, `useSales`, `useEmployees`) untuk mengisolasi re-render komponen.

- [x] **Task 4.2: Perbaikan Bug Zona Waktu Lokal (WIB GMT+7) ([lib/formatters.js](file:///d:/Finance/lib/formatters.js))**
  - [x] Perbaiki fungsi `todayISO()` dan `currentMonthISO()` agar menggunakan waktu lokal pengguna alih-alih konversi UTC murni (`.toISOString()`), yang selama ini mencatat tanggal kemarin antara pukul 00:00 - 07:00 pagi WIB.

- [x] **Task 4.3: Perbaikan Pergeseran Bulan Grafik Tren ([lib/calculations.js](file:///d:/Finance/lib/calculations.js))**
  - [x] Perbaiki fungsi `calculateMonthlyTrends()` agar perhitungan 6 bulan terakhir tidak mundur 1 bulan akibat pergeseran zona waktu saat menginisialisasi `new Date(year, month, 1)`.

- [x] **Task 4.4: Perbaikan Hardcoded End Date di Modul Laporan ([app/dashboard/reports/page.js](file:///d:/Finance/app/dashboard/reports/page.js))**
  - [x] Ganti string hardcode `${currentMonth}-31` dengan kalkulasi hari terakhir dinamis (misal: hari ke-28/29 untuk Feb, 30 untuk Apr/Jun/Sep/Nov, 31 untuk Jan/Mar/Mei/Jul/Ags/Okt/Des) agar valid saat di-parse ke tipe data PostgreSQL `DATE`.

- [x] **Task 4.5: Standardisasi Presisi Kalkulasi Keuangan**
  - [x] Terapkan pembulatan standar mata uang pada fungsi kalkulasi diskon, valuasi inventori, subtotal invoice, dan take-home pay payroll.

---

### 🔹 Fase 5: UI/UX Modernization, Toast Notification & Polish
> **Tujuan**: Menghadirkan antarmuka bisnis kelas premium yang modern, bebas dari dialog pop-up browser jadul.

- [x] **Task 5.1: Komponen Toast Notification Modern ([components/ui/Toast.jsx](file:///d:/Finance/components/ui/Toast.jsx))**
  - [x] Buat provider dan komponen Toast notification yang ringan, elegan, dan non-blocking.
  - [x] Ganti seluruh pemanggilan `window.alert()` pada formulir dan aksi simpan/ekspor.

- [x] **Task 5.2: Modal Konfirmasi Aksi Destruktif ([components/ui/ConfirmModal.jsx](file:///d:/Finance/components/ui/ConfirmModal.jsx))**
  - [x] Buat komponen modal konfirmasi kustom dengan opsi pembatalan yang jelas.
  - [x] Ganti seluruh pemanggilan `window.confirm()` (seperti hapus rekening, batalkan order, reset data).

- [x] **Task 5.3: Paginasi & Filter Cepat pada Tabel Data**
  - [x] Tambahkan kontrol paginasi dan filter pencarian cepat pada halaman mutasi transaksi dan riwayat invoice pesanan.

- [x] **Task 5.4: Loading Skeleton & Micro-Interactions**
  - [x] Tambahkan skeleton loading pada kartu statistik dashboard dan tabel data saat sedang memuat data dari cloud.
  - [x] Tambahkan status *isSubmitting* / spinner pada tombol simpan di seluruh modal transaksi, invoice, dan karyawan.

---

### 🔹 Fase 6: Integrasi Penuh Database Supabase Cloud (Cloud-First Architecture)
> **Tujuan**: Memastikan 100% data di frontend terhubung langsung ke database PostgreSQL Supabase tanpa bergantung pada data tiruan statis, dilengkapi penanganan error database riil, status koneksi cloud, dan seeder data bisnis awal.

- [x] **Task 6.1: Eliminasi Ghost Demo Fallback & Cloud-First Hydration ([context/FinanceContext.js](file:///d:/Finance/context/FinanceContext.js))**
  - [x] Hapus filter `accs.value.length > 0` saat inisialisasi cloud agar state mencerminkan data riil di Supabase PostgreSQL (termasuk saat database kosong).
  - [x] Sediakan state `isCloudEmpty` saat akun baru pertama kali login (0 akun/transaksi terdaftar).
  - [x] Pisahkan storage cache lokal per akun (`zenta_data_{userId}`) agar data antar pengguna tidak tumpang tindih.

- [x] **Task 6.2: Layanan Seeder Data Template Cloud Ber-UUID Valid ([lib/services/migrationService.js](file:///d:/Finance/lib/services/migrationService.js))**
  - [x] Buat fungsi `seedDefaultBusinessDataToCloud(userId)` untuk menyuntikkan template bisnis default (Kas Operasional, Bank BCA, 2 produk contoh, profil) langsung ke PostgreSQL Supabase menggunakan UUID v4 valid.
  - [x] Perbarui `migrateLocalDataToCloud(userId)` agar segera memutakhirkan state memory dan cache lokal dengan ID UUID yang baru tersimpan di cloud.

- [x] **Task 6.3: Mutasi Asinkron Penuh dengan Error Handling & Rollback ([context/FinanceContext.js](file:///d:/Finance/context/FinanceContext.js))**
  - [x] Ubah seluruh fungsi mutasi (accounts, transactions, transfers, sales, products, employees) agar mengembalikan Promise asinkron yang di-await oleh modal.
  - [x] Implementasikan mekanisme rollback state jika transaksi cloud Supabase gagal, serta lemparkan error ke form modal.
  - [x] Pastikan seluruh relasi foreign key (`account_id`, `client_id`, `product_id`, `employee_id`) selalu divalidasi ke format UUID PostgreSQL sebelum dikirim.

- [x] **Task 6.4: Indikator Visual Status Koneksi Cloud & Sinkronisasi On-Demand ([components/layout/Topbar.jsx](file:///d:/Finance/components/layout/Topbar.jsx))**
  - [x] Tambahkan badge status koneksi cloud di samping profil pengguna: 🟢 Cloud Terhubung / 🔄 Menyinkronkan / 🔴 Offline.
  - [x] Sediakan tombol "Refresh / Sinkronkan Ulang" untuk memicu `refreshCloudData()` kapan saja secara instan.

- [x] **Task 6.5: Banner Onboarding Database Bersih vs Muat Template Cloud ([app/dashboard/page.js](file:///d:/Finance/app/dashboard/page.js) & [app/dashboard/settings/page.js](file:///d:/Finance/app/dashboard/settings/page.js))**
  - [x] Tampilkan banner ramah pengguna pada akun baru: "Mulai dari Nol" atau "Isi Template Contoh ke Cloud".
  - [x] Tambahkan tombol "Muat Data Template ke Cloud" di halaman pengaturan jika pengguna ingin menguji coba fitur dengan data database riil.

---

### 🔹 Fase 7: Fitur Jasa & Penyesuaian Katalog Produk & Jasa
> **Tujuan**: Menambahkan dukungan penuh untuk layanan jasa bisnis (tanpa stok fisik, tarif fleksibel per satuan/jam/proyek, non-pengurangan stok pada invoice) dan menyelaraskan antarmuka serta navigasi menu menjadi "Produk & Jasa".

- [x] **Task 7.1: Migrasi Skema Kolom Jasa di Supabase PostgreSQL ([supabase/schema.sql](file:///d:/Finance/supabase/schema.sql))**
  - [x] Tambahkan kolom `type` (`product` / `service`), `category`, `unit`, dan `description` pada tabel `public.products`.
  - [x] Jalankan DDL `ALTER TABLE public.products ADD COLUMN ...` via Supabase MCP.

- [x] **Task 7.2: Penyesuaian Service Layer & Valuasi Inventori ([lib/services/inventoryService.js](file:///d:/Finance/lib/services/inventoryService.js) & [lib/calculations.js](file:///d:/Finance/lib/calculations.js))**
  - [x] Perbarui mapping database dan mutasi service untuk menyertakan `type`, `category`, `unit`, dan `description`.
  - [x] Sesuaikan fungsi `calculateInventoryValuation` agar hanya memperhitungkan produk fisik (`type !== 'service'`) dalam total aset modal stok.

- [x] **Task 7.3: Penyesuaian Pengurangan Stok Invoice ([context/FinanceContext.js](file:///d:/Finance/context/FinanceContext.js))**
  - [x] Pastikan saat pembuatan pesanan/invoice, pemanggilan `adjustStock` hanya dilakukan pada produk fisik (`type !== 'service'`). Jasa tidak pernah mengurangi stok.

- [x] **Task 7.4: Navigasi Sidebar & Penyesuaian Menu ([components/layout/Sidebar.jsx](file:///d:/Finance/components/layout/Sidebar.jsx))**
  - [x] Ubah label menu "Inventori Produk" menjadi "Produk & Jasa".
  - [x] Sesuaikan judul grup navigasi menjadi "PENJUALAN & KATALOG".

- [x] **Task 7.5: Form Modal Produk & Jasa Dinamis ([components/inventory/ProductModal.jsx](file:///d:/Finance/components/inventory/ProductModal.jsx))**
  - [x] Sediakan segmented control pemilih tipe: 📦 Barang Fisik vs 💼 Jasa / Layanan.
  - [x] Sembunyikan field stok dan batas minimum jika tipe Jasa dipilih, serta tampilkan opsi satuan tarif (Jam, Sesi, Hari, Proyek, Paket).

- [x] **Task 7.6: Halaman Katalog Terpadu & Filter Jasa ([app/dashboard/inventory/page.js](file:///d:/Finance/app/dashboard/inventory/page.js) & [components/sales/InvoiceModal.jsx](file:///d:/Finance/components/sales/InvoiceModal.jsx))**
  - [x] Tambahkan tab filter: Semua, Barang Fisik, Jasa & Layanan, dan Stok Kritis.
  - [x] Tampilkan badge status dan label khusus Jasa pada tabel katalog dan dropdown item invoice.

---

### 🔹 Fase 8: Perapihan & Standardisasi Tampilan Responsif Mobile (Multi-Device)
> **Tujuan**: Menjadikan seluruh halaman, navigasi, tabel, modal, dan grafik tampil rapi, proporsional, serta nyaman dioperasikan dengan sentuhan di semua ukuran perangkat (Mobile 320px–480px, Tablet 481px–1024px, Desktop >1024px).

- [x] **Task 8.1: Utility CSS Responsif & Standarisasi Breakpoint ([app/globals.css](file:///d:/Finance/app/globals.css))**
  - [x] Definisikan utility `.table-wrapper` dan `.table-responsive` dengan smooth horizontal touch scrolling.
  - [x] Tambahkan utility responsif `.dashboard-charts-grid`, `.dashboard-bottom-grid`, `.dashboard-skeleton-grid`, `.filter-toolbar-grid`, `.settings-layout-grid`, `.report-assets-grid`, dan `.scrollable-tabs-bar`.
  - [x] Atur breakpoint media queries: `<= 1024px` (tablet), `<= 768px` (mobile), `<= 480px` (small mobile).

- [x] **Task 8.2: Optimasi Shell & Navigasi Mobile ([components/layout/Topbar.jsx](file:///d:/Finance/components/layout/Topbar.jsx) & [components/layout/Sidebar.jsx](file:///d:/Finance/components/layout/Sidebar.jsx))**
  - [x] Pastikan drawer Sidebar memiliki `z-index: 200` dan backdrop `z-index: 190` dengan animasi slide yang mulus.
  - [x] Optimalkan Topbar pada mobile: tombol Aksi Cepat ringkas, badge cloud compact, dan avatar profil rapi tanpa teks meluber.

- [x] **Task 8.3: Pembenahan Grid Dasbor Utama ([app/dashboard/page.js](file:///d:/Finance/app/dashboard/page.js))**
  - [x] Ganti inline grid baris grafik arus kas & donut beban (`1.3fr 0.9fr`) dengan `.dashboard-charts-grid`.
  - [x] Ganti inline grid rekening & transaksi terbaru (`1fr 1.4fr`) dengan `.dashboard-bottom-grid`.
  - [x] Ganti inline skeleton grid (`1.8fr 1.2fr`) dengan `.dashboard-skeleton-grid`.

- [x] **Task 8.4: Toolbar Filter & Tabel Mutasi Transaksi ([app/dashboard/transactions/page.js](file:///d:/Finance/app/dashboard/transactions/page.js))**
  - [x] Ganti inline 5-kolom filter toolbar dengan `.filter-toolbar-grid` (menjadi 1 kolom per input di layar kecil).
  - [x] Pastikan pembungkus tabel menggunakan kelas yang memiliki scroll horizontal halus.

- [x] **Task 8.5: Adaptasi Mobile Halaman Finansial, Katalog, SDM, Laporan & Pengaturan**
  - [x] [app/dashboard/accounts/page.js](file:///d:/Finance/app/dashboard/accounts/page.js): Rapikan tombol aksi header dan grid kartu rekening di mobile.
  - [x] [app/dashboard/sales/page.js](file:///d:/Finance/app/dashboard/sales/page.js): Terapkan swipeable tabs dan perbaiki susunan filter tagihan.
  - [x] [app/dashboard/inventory/page.js](file:///d:/Finance/app/dashboard/inventory/page.js): Terapkan `.scrollable-tabs-bar` pada filter kategori katalog.
  - [x] [app/dashboard/employees/page.js](file:///d:/Finance/app/dashboard/employees/page.js): Terapkan `.scrollable-tabs-bar` pada 3 tab SDM dan rapikan tombol tambah.
  - [x] [app/dashboard/reports/page.js](file:///d:/Finance/app/dashboard/reports/page.js): Ganti inline 4-kolom ringkasan aset lancar dengan `.report-assets-grid`.
  - [x] [app/dashboard/settings/page.js](file:///d:/Finance/app/dashboard/settings/page.js): Ganti inline 2-kolom layout profil dan backup dengan `.settings-layout-grid`.

- [x] **Task 8.6: Modals, Dialogs, Toasts, Charts & Halaman Autentikasi**
  - [x] [components/ui/Toast.jsx](file:///d:/Finance/components/ui/Toast.jsx): Responsifkan toast container agar berlabuh di bawah layar dengan margin seimbang pada mobile.
  - [x] [components/charts/CashFlowChart.jsx](file:///d:/Finance/components/charts/CashFlowChart.jsx): Sesuaikan ukuran bar chart dan label bulan pada layar <= 480px.
  - [x] [components/sales/InvoicePrintModal.jsx](file:///d:/Finance/components/sales/InvoicePrintModal.jsx) & [components/employees/PayslipModal.jsx](file:///d:/Finance/components/employees/PayslipModal.jsx): Header dokumen cetak bertumpuk di mobile preview.
  - [x] [app/page.js](file:///d:/Finance/app/page.js): Tampilkan `.mobile-brand` saat sisi cerita disembunyikan di mobile.

- [x] **Task 8.7: Verifikasi Linter, Build & Browser Multi-Resolution Testing**
  - [x] Jalankan `npm run lint` untuk memastikan 0 error.
  - [x] Jalankan `npm run build` untuk memastikan build produksi tanpa kendala.
  - [x] Uji responsivitas pada resolusi mobile (375px, 390px, 412px), tablet (768px, 820px), dan desktop (1440px).

---

### 🔹 Fase 9: Integritas Transaksi, Atomisitas & Kontrol Konkurensi
> **Tujuan**: Menghilangkan risiko pencatatan keuangan parsial/inkonsisten (invoice lunas tanpa mutasi kas, payroll tanpa pengeluaran kas, pengurangan stok yang salah/tertimpa, dan pembayaran ganda). Mengatasi temuan prioritas tinggi: **F01, F02, F03, F04, F05**.

- [x] **Task 9.1: Operasi Transaksi Atomik Pembuatan Invoice & Penggajian ([lib/services/salesService.js](file:///d:/Finance/lib/services/salesService.js), [lib/services/employeesService.js](file:///d:/Finance/lib/services/employeesService.js), [context/FinanceContext.js](file:///d:/Finance/context/FinanceContext.js) - F01)**
  - [x] Implementasikan transaksi terpadu/RPC Supabase atau batch transaction rollback saat pembuatan invoice baru.
  - [x] Pastikan jika insert `order_items`, mutasi kas (`transactions`), atau pengurangan stok (`adjustStock`) gagal, header invoice yang tersimpan dibatalkan secara atomik (tanpa meninggalkan record zombie/parsial).
  - [x] Hubungkan relasi eksplisit pada tabel `transactions` (`order_id` / `source_id`) untuk melacak asal mutasi kas dari invoice.
  - [x] Terapkan atomisitas serupa pada penggajian payroll (`payroll` dan mutasi kas pengeluaran gaji tidak boleh terpisah).

- [x] **Task 9.2: Standarisasi Async Await & Penanganan Status Pending di Seluruh Pemanggil UI ([components/finance/TransactionModal.jsx](file:///d:/Finance/components/finance/TransactionModal.jsx), [components/finance/TransferModal.jsx](file:///d:/Finance/components/finance/TransferModal.jsx), [app/dashboard/settings/page.js](file:///d:/Finance/app/dashboard/settings/page.js), [app/dashboard/sales/page.js](file:///d:/Finance/app/dashboard/sales/page.js) - F02)**
  - [x] Tambahkan `await` pada seluruh pemanggilan mutasi: `addTransaction`, `addTransfer`, `updateProfile`, `payOrder`, `deleteAccount`, `deleteOrder`, dan `deletePayroll`.
  - [x] Tangani error secara tertangkap (`try/catch/finally`), kunci tombol aksi dengan state `isSubmitting` / `isProcessing` untuk mencegah klik ganda (*double click*).
  - [x] Pastikan modal hanya menutup dan menampilkan notifikasi sukses setelah komit cloud benar-benar selesai dan berhasil.

- [x] **Task 9.3: Koreksi Pengurangan Stok Produk Berulang & Kontrol Konkurensi ([context/FinanceContext.js](file:///d:/Finance/context/FinanceContext.js) & [components/sales/InvoiceModal.jsx](file:///d:/Finance/components/sales/InvoiceModal.jsx) - F03)**
  - [x] Agregasikan kuantitas item per `productId` sebelum memproses pengurangan stok (eliminasi bug loop yang menimpa stok untuk produk yang sama di multi-baris invoice).
  - [x] Validasi ketersediaan stok fisik sebelum pesanan disetujui; tolak transaksi jika kuantitas melebihi stok yang ada (eliminasi `Math.max(0, ...)` yang menyembunyikan over-selling).
  - [x] Gunakan operasi pengurangan relatif di database alih-alih menimpa nilai absolut snapshot browser untuk mencegah tabrakan stok antarperangkat.

- [x] **Task 9.4: Proteksi Pembayaran Ganda Pelunasan Invoice ([context/FinanceContext.js](file:///d:/Finance/context/FinanceContext.js), [app/dashboard/sales/page.js](file:///d:/Finance/app/dashboard/sales/page.js), [supabase/schema.sql](file:///d:/Finance/supabase/schema.sql) - F04)**
  - [x] Terapkan idempotency key atau guard pengecekan status terkini berbasis database saat pelunasan invoice dilakukan.
  - [x] Tambahkan constraint unik atau verifikasi transaksi kas agar invoice yang sudah berstatus 'Lunas' tidak dapat membuat entri transaksi pemasukan baru jika dipicu bersamaan.
  - [x] Nonaktifkan tombol aksi bayar di UI segera setelah klik pertama diproses (*immediate click-lock*).

- [x] **Task 9.5: Lifecycle Penghapusan & Pembatalan Invoice/Payroll ([context/FinanceContext.js](file:///d:/Finance/context/FinanceContext.js) & [app/dashboard/sales/page.js](file:///d:/Finance/app/dashboard/sales/page.js) - F05)**
  - [x] Saat order/invoice dihapus atau dibatalkan, kembalikan stok produk fisik yang bersangkutan secara otomatis.
  - [x] Buat transaksi kas pembalik atau hapus mutasi pemasukan kas yang terhubung dengan invoice yang dibatalkan/dihapus.
  - [x] Saat record payroll dihapus/dibatalkan, sinkronkan pembatalan transaksi pengeluaran kas yang terkait dengan payroll tersebut.

---

### 🔹 Fase 10: Penguatan Autentikasi, Keamanan Sesi & Skema Database
> **Tujuan**: Memastikan rute terlindungi dengan validasi token kriptografis, relasi data lintas tabel memiliki kepemilikan user yang ketat, dan aturan bisnis ditegakkan di level PostgreSQL. Mengatasi temuan: **F09, F10, F16**.

- [ ] **Task 10.1: Validasi Keabsahan Sesi & Pembaruan Token di Rute ([proxy.js](file:///d:/Finance/proxy.js) & [lib/supabase.js](file:///d:/Finance/lib/supabase.js) - F09)**
  - [ ] Perbarui `proxy.js` agar memvalidasi keabsahan token/sesi pengguna via Supabase SSR (`getUser` / `getClaims`) alih-alih hanya memeriksa keberadaan string cookie acak.
  - [ ] Tangani token kedaluwarsa secara mulus dengan redirect ke halaman login dan pembersihan cookie basi.
  - [ ] Sinkronkan manajemen cookie antara browser dan server sesuai panduan resmi Supabase Next.js App Router.

- [ ] **Task 10.2: Penegakan Integritas Kepemilikan Relasi Antar-Tabel ([supabase/schema.sql](file:///d:/Finance/supabase/schema.sql) - F10)**
  - [ ] Pastikan setiap relasi anak-induk (`transactions` -> `accounts`, `order_items` -> `orders`, `transfers` -> `accounts`, `payroll` -> `employees`) menjamin bahwa `user_id` entitas anak sama persis dengan `user_id` entitas induk.
  - [ ] Tambahkan composite unique constraint pada tabel induk `(id, user_id)` dan jadikan rujukan composite foreign key pada tabel anak, atau pasang trigger validasi kepemilikan.
  - [ ] Uji isolasi antar-pengguna untuk memastikan akun A tidak dapat menautkan record ke akun B.

- [ ] **Task 10.3: Penguatan Constraint Aturan Bisnis & Proteksi Histori ([supabase/schema.sql](file:///d:/Finance/supabase/schema.sql) - F16)**
  - [ ] Tambahkan `CONSTRAINT unique_invoice_number_per_user UNIQUE (user_id, invoice_number)`.
  - [ ] Tambahkan constraint nilai non-negatif pada stok produk (`stock >= 0`), harga (`price >= 0`, `cost_price >= 0`), dan kuantitas item invoice (`quantity > 0`).
  - [ ] Tambahkan constraint unik absensi per karyawan per tanggal `UNIQUE(employee_id, date)`.
  - [ ] Tambahkan constraint rekening transfer asal dan tujuan tidak boleh sama `CHECK(from_account_id <> to_account_id)`.
  - [ ] Evaluasi `ON DELETE CASCADE` pada rekening dan karyawan; ganti dengan proteksi pembatasan (*RESTRICT*) atau penandaan status arsip (*soft delete*) agar histori audit transaksi tidak hilang saat master dihapus.

---

### 🔹 Fase 11: Validasi Cadangan, Pemulihan Data & Indikator Sinkronisasi
> **Tujuan**: Memastikan integritas data saat backup/restore, migrasi yang aman dan idempotent, penanganan error sinkronisasi transparan, serta eliminasi race condition state. Mengatasi temuan: **F06, F07, F12, F17, F18**.

- [ ] **Task 11.1: Pemisahan Eksplisit & Idempotensi Alur Import, Restore Cloud, Migrasi Legacy & Template ([lib/services/migrationService.js](file:///d:/Finance/lib/services/migrationService.js) & [context/FinanceContext.js](file:///d:/Finance/context/FinanceContext.js) - F06)**
  - [ ] Pisahkan secara tegas 4 operasi: (a) Import JSON ke state/cache, (b) Restore penuh ke PostgreSQL Supabase, (c) Migrasi data lokal legacy, (d) Muat data contoh template.
  - [ ] Buat pemetaan ID legacy yang persisten/idempotent sehingga eksekusi migrasi berulang tidak menciptakan duplikasi akun atau record baru dengan UUID acak.
  - [ ] Pastikan seeder template tidak menimpa profil usaha atau data aktif yang telah ada.
  - [ ] Tampilkan modal ringkasan perubahan (*diff preview*) sebelum pengguna mengonfirmasi restore atau migrasi data ke cloud.

- [ ] **Task 11.2: Validasi Skema Ketat Impor JSON & Sanitasi Cache ([lib/storage.js](file:///d:/Finance/lib/storage.js) & [context/FinanceContext.js](file:///d:/Finance/context/FinanceContext.js) - F07)**
  - [ ] Terapkan validasi skema runtime (versi skema, pemeriksaan array untuk semua koleksi, pengecekan tipe data, nilai numerik finite, dan format tanggal).
  - [ ] Tolak berkas JSON yang tidak sesuai skema dengan pesan kesalahan informatif sebelum masuk ke state.
  - [ ] Isolasi pemulihan cache rusak: jika cache lokal pengguna korup, tandai status gagal dan arahkan untuk fetch ulang dari cloud (jangan fallback ke data demo contoh).

- [ ] **Task 11.3: Transparansi Status Sinkronisasi & Error Aggregation ([context/FinanceContext.js](file:///d:/Finance/context/FinanceContext.js) & [components/layout/Topbar.jsx](file:///d:/Finance/components/layout/Topbar.jsx) - F12)**
  - [ ] Periksa hasil `Promise.allSettled` pada `fetchCloudData`; hitung dan laporkan jika ada service yang ditolak (*rejected*).
  - [ ] Sediakan status sinkronisasi granular: 🟢 Tersinkronisasi Penuh, 🟡 Sinkron Sebagian (ada modul gagal), 🔴 Gagal Sinkron / Offline.
  - [ ] Catat timestamp `lastSuccessfulSync` dan informasikan kepada pengguna bila data yang ditampilkan merupakan data cache lokal.

- [ ] **Task 11.4: Penyelarasan Lifecycle Form Profil Bisnis ([app/dashboard/settings/page.js](file:///d:/Finance/app/dashboard/settings/page.js) - F17)**
  - [ ] Perbaiki inisialisasi form profil di pengaturan agar bereaksi terhadap pembaruan data cloud yang tiba asinkron (selama form belum dalam kondisi diubah/dirty oleh pengguna).
  - [ ] Mencegah penyimpanan profil default/kosong yang tidak sengaja menimpa data bisnis riil di database cloud.

- [ ] **Task 11.5: Generation Token & Penanganan Race Condition Fetch ([context/FinanceContext.js](file:///d:/Finance/context/FinanceContext.js) - F18)**
  - [ ] Tambahkan request generation token atau AbortController pada pemanggilan `fetchCloudData` agar respons lama yang datang terlambat tidak menimpa mutasi state terbaru.
  - [ ] Kunci cooldown fetch per user dan pastikan pemanggilan paksa (*forceRefresh*) selalu mendapatkan data teranyar setelah mutasi komit selesai.

---

### 🔹 Fase 12: Ketepatan Logika Finansial, Valuasi, Akuntansi & Keamanan Ekspor
> **Tujuan**: Menghilangkan cacat kalkulasi finansial (kewajiban kartu kredit, valuasi modal nol, filter stok jasa), memperjelas semantik laporan keuangan, dan mengamankan ekspor CSV. Mengatasi temuan: **F11, F13, F14, F15, F19**.

- [ ] **Task 12.1: Koreksi Tanda & Konvensi Kewajiban Kartu Kredit ([lib/calculations.js](file:///d:/Finance/lib/calculations.js) - F11)**
  - [ ] Perbaiki fungsi `calculateNetWorth`: saldo negatif pada rekening bertipe 'Kartu Kredit' / Utang harus dihitung sebagai kewajiban (*liabilities*) yang mengurangi kekayaan bersih (bukan diabaikan menjadi Rp0).
  - [ ] Tetapkan konvensi penanganan transaksi pembayaran tagihan kartu kredit (transfer antar-rekening vs expense) agar saldo dan net worth konsisten.

- [ ] **Task 12.2: Persistensi Snapshot Identitas Pelanggan & Rekening pada Invoice ([components/sales/InvoiceModal.jsx](file:///d:/Finance/components/sales/InvoiceModal.jsx), [lib/services/salesService.js](file:///d:/Finance/lib/services/salesService.js), [supabase/schema.sql](file:///d:/Finance/supabase/schema.sql) - F13)**
  - [ ] Tambahkan kolom `client_name` dan `client_address` langsung pada tabel `orders` untuk menyimpan nama pelanggan bebas (custom customer) agar tidak ter-reset menjadi "Klien Umum" saat disimpan ke cloud.
  - [ ] Simpan snapshot rekening tujuan pembayaran yang dipilih pada order, sehingga dokumen invoice historis tidak berubah bila rekening master diperbarui atau dihapus.
  - [ ] Izinkan pengguna memilih rekening tujuan penerimaan dana secara eksplisit saat melakukan pelunasan tagihan dari daftar invoice.

- [ ] **Task 12.3: Perbaikan Fallback Angka Nol pada Valuasi & Dashboard ([lib/calculations.js](file:///d:/Finance/lib/calculations.js), [lib/services/inventoryService.js](file:///d:/Finance/lib/services/inventoryService.js), [app/dashboard/page.js](file:///d:/Finance/app/dashboard/page.js) - F14)**
  - [ ] Perbaiki `calculateInventoryValuation`: gunakan pengecekan `costPrice != null ? costPrice : price` agar produk dengan modal 0 (`costPrice = 0`) tidak salah dinilai menggunakan harga jual.
  - [ ] Perbaiki mapper di `inventoryService.js`: gunakan nullish coalescing `min_stock ?? 5` agar batas minimum stok 0 tidak dipaksa berubah menjadi 5.
  - [ ] Saring item dengan `type !== 'service'` pada daftar widget "Stok Kritis / Rendah" di dasbor utama agar layanan jasa (stok 0) tidak muncul sebagai stok habis.

- [ ] **Task 12.4: Standarisasi Semantik Laporan Keuangan, HPP & Pelunasan Bertahap ([app/dashboard/reports/page.js](file:///d:/Finance/app/dashboard/reports/page.js), [lib/calculations.js](file:///d:/Finance/lib/calculations.js) - F15)**
  - [ ] Definisikan pencatatan Harga Pokok Penjualan (HPP) yang jelas saat penjualan produk fisik terjadi.
  - [ ] Sediakan dukungan pencatatan pembayaran sebagian (*partial payment / remaining balance*) pada invoice berstatus 'Sebagian' agar total piutang riil akurat.
  - [ ] Terapkan pembulatan standar mata uang Rupiah bulat secara konsisten di seluruh lapisan komputasi dan penyimpanan.

- [ ] **Task 12.5: Pengamanan Ekspor CSV & Integrasi Filter Aktif ([lib/storage.js](file:///d:/Finance/lib/storage.js) & [app/dashboard/transactions/page.js](file:///d:/Finance/app/dashboard/transactions/page.js) - F19)**
  - [ ] Ganti ekspor berbasis Data URI dengan Blob dan `URL.createObjectURL` agar karakter `#` dan simbol khusus pada catatan tidak merusak/memotong data unduhan.
  - [ ] Netralisir potensi CSV Formula Injection (awalan `=`, `+`, `-`, `@`) dengan menambahkan prefix kutip tunggal `'` pada isi sel string.
  - [ ] Teruskan data hasil pencarian dan filter tanggal yang sedang aktif dari halaman transaksi ke fungsi ekspor (bukan selalu mengekspor seluruh transaksi).

---

### 🔹 Fase 13: Optimasi Performa Lanjutan, Skalabilitas & Pengujian Kualitas
> **Tujuan**: Memastikan aplikasi siap menangani volume data bertumbuh melalui paginasi server, peningkatan aksesibilitas UI/UX, dan suite pengujian verifikasi otomatis. Mengatasi temuan: **F08 dan Rekomendasi Audit Bagian 8-12**.

- [ ] **Task 13.1: Server-Side Pagination & Pemuatan Data Efisien ([lib/services/](file:///d:/Finance/lib/services) & [context/FinanceContext.js](file:///d:/Finance/context/FinanceContext.js) - F08)**
  - [ ] Implementasikan query `range(from, to)` dan query agregasi `count` pada service transaksi dan invoice untuk menangani dataset yang melebihi batas default Supabase Data API.
  - [ ] Evaluasi pemuatan bertahap (*lazy loading* per tab/halaman) agar modul SDM/karyawan tidak perlu dimuat saat pengguna hanya membuka dashboard kas.

- [ ] **Task 13.2: Aksesibilitas Dialog Modal & Toast ([components/ui/](file:///d:/Finance/components/ui/))**
  - [ ] Tambahkan atribut aksesibilitas `aria-labelledby`, `aria-describedby`, dan jebakan fokus (*focus trapping*) pada komponen modal.
  - [ ] Lengkapi `ConfirmModal` dengan handler tombol `Escape` dan label tombol yang ramah pembaca layar (*screen reader*).
  - [ ] Tambahkan atribut `aria-live="polite"` pada Toast container.

- [ ] **Task 13.3: Suite Pengujian Otomatis untuk 15 Skenario Lokal Audit ([scripts/test-audit-scenarios.mjs](file:///d:/Finance/scripts/test-audit-scenarios.mjs))**
  - [ ] Buat skrip pengujian regresi otomatis yang memvalidasi perbaikan ke-15 skenario sintetis yang direproduksi dalam audit (kartu kredit, valuasi modal nol, stok berulang, pembatalan order, impor JSON valid/invalid, dll.).
  - [ ] Tambahkan script `"test:audit"` pada `package.json` untuk verifikasi berkelanjutan.

- [ ] **Task 13.4: Dokumentasi Operasional & Berkas Contoh Environment ([.env.example](file:///d:/Finance/.env.example) & [README.md](file:///d:/Finance/README.md))**
  - [ ] Buat file template `.env.example` yang mencantumkan variabel konfigurasi Supabase yang dibutuhkan.
  - [ ] Perbarui `README.md` dengan panduan penyiapan database, eksekusi migrasi DDL, dan instruksi verifikasi.

---

## 📌 Catatan Pelaksanaan & Aturan Kerja
1. Setiap task yang telah selesai dikerjakan harus diubah statusnya menjadi `[x]`.
2. Lakukan pengujian langsung (verifikasi MCP / browser) setiap menyelesaikan satu task besar sebelum melanjutkan ke task berikutnya.
3. Selalu perhatikan kompatibilitas skema database dan keamanan *Row Level Security* (RLS).

