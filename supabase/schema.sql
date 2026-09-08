-- =======================================================
-- ZENTA FINANCE - SUPABASE POSTGRESQL SCHEMA (SCALABLE)
-- =======================================================
-- Jalankan skrip ini di Supabase SQL Editor jika Anda ingin
-- mengaktifkan database cloud multi-device & multi-user.
-- Dilengkapi dengan Row Level Security (RLS) terisolasi per user.

-- 1. Tabel Profil Bisnis
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL DEFAULT 'ZENTA Business',
  tagline TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  currency TEXT DEFAULT 'IDR',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel Rekening Kas & Bank
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'Cash', 'Bank', 'Giro', 'E-Wallet', 'Kartu Kredit'
  account_number TEXT,
  initial_balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabel Transaksi (Pemasukan & Pengeluaran)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  category TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabel Transfer Antar Rekening
CREATE TABLE IF NOT EXISTS public.transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  to_account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabel Klien / Pelanggan
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabel Produk / Stok Inventori
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  cost_price NUMERIC NOT NULL DEFAULT 0,
  price NUMERIC NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  min_stock INT NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabel Pesanan & Invoice Penjualan
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'Baru', -- 'Baru', 'Diproses', 'Selesai', 'Dibatalkan'
  payment_status TEXT NOT NULL DEFAULT 'Belum Dibayar', -- 'Belum Dibayar', 'Sebagian', 'Lunas'
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  grand_total NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tabel Item Pesanan
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  qty INT NOT NULL DEFAULT 1,
  price NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0
);

-- 9. Tabel Karyawan
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  phone TEXT,
  base_salary NUMERIC NOT NULL DEFAULT 0,
  join_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'Aktif',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Tabel Absensi Karyawan
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'Hadir',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Tabel Penggajian (Payroll)
CREATE TABLE IF NOT EXISTS public.payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  period TEXT NOT NULL, -- 'YYYY-MM'
  base_salary NUMERIC NOT NULL DEFAULT 0,
  allowance NUMERIC NOT NULL DEFAULT 0,
  deduction NUMERIC NOT NULL DEFAULT 0,
  net_salary NUMERIC NOT NULL DEFAULT 0,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'Dibayar',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================================================
-- AKTIFKAN ROW LEVEL SECURITY (RLS)
-- =======================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;

-- Policy Templates untuk user id
CREATE POLICY "Users can only view their own profile" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can only manage their accounts" ON public.accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only manage their transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only manage their transfers" ON public.transfers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only manage their clients" ON public.clients FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only manage their products" ON public.products FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only manage their orders" ON public.orders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only manage their employees" ON public.employees FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only manage their attendance" ON public.attendance FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only manage their payroll" ON public.payroll FOR ALL USING (auth.uid() = user_id);
