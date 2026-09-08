"use client";

import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import {
  loadLocalData,
  saveLocalData,
  exportDataToJSON,
  exportTransactionsToCSV,
  getInitialData,
} from "../lib/storage";
import {
  calculateAccountBalances,
  calculateNetWorth,
  calculateInventoryValuation,
  calculateMonthlyTrends,
} from "../lib/calculations";
import { uid, todayISO } from "../lib/formatters";
import { supabase } from "../lib/supabase";

const FinanceContext = createContext(null);

export function FinanceProvider({ children }) {
  const [data, setData] = useState(getInitialData);
  const [isLoaded, setIsLoaded] = useState(false);
  const [user, setUser] = useState(null);

  // Inisialisasi data dari storage lokal & periksa sesi Supabase
  useEffect(() => {
    const loaded = loadLocalData();
    setData(loaded);
    setIsLoaded(true);

    // Ambil sesi user Supabase jika ada
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser(session.user);
        }
      });

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
      });

      return () => {
        authListener?.subscription?.unsubscribe();
      };
    }
  }, []);

  // Simpan otomatis ke local storage setiap kali data berubah
  useEffect(() => {
    if (isLoaded) {
      saveLocalData(data);
    }
  }, [data, isLoaded]);

  // ================= ACTIONS =================

  // Profil
  const updateProfile = useCallback((profileUpdates) => {
    setData((prev) => ({
      ...prev,
      profile: { ...prev.profile, ...profileUpdates },
    }));
  }, []);

  // Rekening Bank & Kas
  const addAccount = useCallback((account) => {
    const newAccount = {
      id: uid("acc"),
      initialBalance: 0,
      accountNumber: "-",
      ...account,
    };
    setData((prev) => ({
      ...prev,
      accounts: [...prev.accounts, newAccount],
    }));
    return newAccount;
  }, []);

  const updateAccount = useCallback((id, updates) => {
    setData((prev) => ({
      ...prev,
      accounts: prev.accounts.map((acc) => (acc.id === id ? { ...acc, ...updates } : acc)),
    }));
  }, []);

  const deleteAccount = useCallback((id) => {
    setData((prev) => ({
      ...prev,
      accounts: prev.accounts.filter((acc) => acc.id !== id),
      // Hapus juga transaksi dan transfer yang terikat dengan rekening ini
      transactions: prev.transactions.filter((tx) => tx.accountId !== id),
      transfers: prev.transfers.filter((tr) => tr.fromAccountId !== id && tr.toAccountId !== id),
    }));
  }, []);

  // Transaksi Pemasukan & Pengeluaran
  const addTransaction = useCallback((tx) => {
    const newTx = {
      id: uid("tx"),
      date: todayISO(),
      ...tx,
    };
    setData((prev) => ({
      ...prev,
      transactions: [newTx, ...prev.transactions],
    }));
    return newTx;
  }, []);

  const deleteTransaction = useCallback((id) => {
    setData((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((tx) => tx.id !== id),
    }));
  }, []);

  // Transfer Antar Rekening
  const addTransfer = useCallback((transfer) => {
    const newTr = {
      id: uid("tr"),
      date: todayISO(),
      ...transfer,
    };
    setData((prev) => ({
      ...prev,
      transfers: [newTr, ...prev.transfers],
    }));
    return newTr;
  }, []);

  const deleteTransfer = useCallback((id) => {
    setData((prev) => ({
      ...prev,
      transfers: prev.transfers.filter((tr) => tr.id !== id),
    }));
  }, []);

  // Klien / Pelanggan
  const addClient = useCallback((client) => {
    const newClient = {
      id: uid("cl"),
      ...client,
    };
    setData((prev) => ({
      ...prev,
      clients: [...prev.clients, newClient],
    }));
    return newClient;
  }, []);

  const updateClient = useCallback((id, updates) => {
    setData((prev) => ({
      ...prev,
      clients: prev.clients.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  }, []);

  const deleteClient = useCallback((id) => {
    setData((prev) => ({
      ...prev,
      clients: prev.clients.filter((c) => c.id !== id),
    }));
  }, []);

  // Produk & Stok
  const addProduct = useCallback((product) => {
    const newProd = {
      id: uid("pr"),
      minStock: 5,
      ...product,
    };
    setData((prev) => ({
      ...prev,
      products: [...prev.products, newProd],
    }));
    return newProd;
  }, []);

  const updateProduct = useCallback((id, updates) => {
    setData((prev) => ({
      ...prev,
      products: prev.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  }, []);

  const adjustStock = useCallback((id, newStock) => {
    setData((prev) => ({
      ...prev,
      products: prev.products.map((p) => (p.id === id ? { ...p, stock: Number(newStock) || 0 } : p)),
    }));
  }, []);

  const deleteProduct = useCallback((id) => {
    setData((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== id),
    }));
  }, []);

  // Pesanan & Invoice
  const addOrder = useCallback((order) => {
    const newOrder = {
      id: uid("ord"),
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`,
      date: todayISO(),
      ...order,
    };

    setData((prev) => {
      // Kurangi stok produk secara otomatis jika pesanan dibuat
      const updatedProducts = prev.products.map((prod) => {
        const item = newOrder.items.find((it) => it.productId === prod.id);
        if (item) {
          return {
            ...prod,
            stock: Math.max(0, Number(prod.stock || 0) - Number(item.qty || 0)),
          };
        }
        return prod;
      });

      // Jika order dibuat dengan status Lunas dan ada paidAccountId, otomatis catat transaksi pemasukan
      let updatedTransactions = prev.transactions;
      if (newOrder.paymentStatus === "Lunas" && newOrder.paidAccountId) {
        const autoTx = {
          id: uid("tx"),
          type: "income",
          accountId: newOrder.paidAccountId,
          amount: newOrder.grandTotal,
          category: "Penjualan Produk",
          date: newOrder.date || todayISO(),
          notes: `Pembayaran Pelunasan ${newOrder.invoiceNumber} (${newOrder.clientName || "Klien"})`,
        };
        updatedTransactions = [autoTx, ...updatedTransactions];
      }

      return {
        ...prev,
        products: updatedProducts,
        orders: [newOrder, ...prev.orders],
        transactions: updatedTransactions,
      };
    });

    return newOrder;
  }, []);

  const updatePaymentStatus = useCallback((orderId, paymentStatus, paidAccountId) => {
    setData((prev) => {
      const order = prev.orders.find((o) => o.id === orderId);
      if (!order) return prev;

      let updatedTransactions = prev.transactions;
      // Jika berubah menjadi Lunas dan sebelumnya belum lunas, catat transaksi pemasukan
      if (paymentStatus === "Lunas" && order.paymentStatus !== "Lunas" && paidAccountId) {
        const autoTx = {
          id: uid("tx"),
          type: "income",
          accountId: paidAccountId,
          amount: order.grandTotal,
          category: "Penjualan Produk",
          date: todayISO(),
          notes: `Pelunasan Invoice ${order.invoiceNumber} (${order.clientName || "Klien"})`,
        };
        updatedTransactions = [autoTx, ...updatedTransactions];
      }

      return {
        ...prev,
        orders: prev.orders.map((o) =>
          o.id === orderId ? { ...o, paymentStatus, paidAccountId: paidAccountId || o.paidAccountId } : o
        ),
        transactions: updatedTransactions,
      };
    });
  }, []);

  const updateOrderStatus = useCallback((orderId, status) => {
    setData((prev) => ({
      ...prev,
      orders: prev.orders.map((o) => (o.id === orderId ? { ...o, status } : o)),
    }));
  }, []);

  const deleteOrder = useCallback((orderId) => {
    setData((prev) => {
      const order = prev.orders.find((o) => o.id === orderId);
      if (!order) return prev;

      // Kembalikan stok produk jika order dihapus
      const restockedProducts = prev.products.map((prod) => {
        const item = order.items?.find((it) => it.productId === prod.id);
        if (item) {
          return {
            ...prod,
            stock: Number(prod.stock || 0) + Number(item.qty || 0),
          };
        }
        return prod;
      });

      return {
        ...prev,
        products: restockedProducts,
        orders: prev.orders.filter((o) => o.id !== orderId),
      };
    });
  }, []);

  // Karyawan
  const addEmployee = useCallback((employee) => {
    const newEmp = {
      id: uid("emp"),
      status: "Aktif",
      joinDate: todayISO(),
      ...employee,
    };
    setData((prev) => ({
      ...prev,
      employees: [...prev.employees, newEmp],
    }));
    return newEmp;
  }, []);

  const updateEmployee = useCallback((id, updates) => {
    setData((prev) => ({
      ...prev,
      employees: prev.employees.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));
  }, []);

  const deleteEmployee = useCallback((id) => {
    setData((prev) => ({
      ...prev,
      employees: prev.employees.filter((e) => e.id !== id),
      attendance: prev.attendance.filter((a) => a.employeeId !== id),
      payroll: prev.payroll.filter((p) => p.employeeId !== id),
    }));
  }, []);

  // Absensi
  const addAttendance = useCallback((record) => {
    const newAtt = {
      id: uid("att"),
      date: todayISO(),
      status: "Hadir",
      ...record,
    };
    setData((prev) => ({
      ...prev,
      attendance: [newAtt, ...prev.attendance],
    }));
    return newAtt;
  }, []);

  const deleteAttendance = useCallback((id) => {
    setData((prev) => ({
      ...prev,
      attendance: prev.attendance.filter((a) => a.id !== id),
    }));
  }, []);

  // Penggajian (Payroll)
  const addPayroll = useCallback((record) => {
    const newPay = {
      id: uid("pay"),
      paymentDate: todayISO(),
      status: "Dibayar",
      ...record,
    };

    setData((prev) => {
      let updatedTransactions = prev.transactions;
      // Catat otomatis ke pengeluaran jika ada accountId pembayar
      if (newPay.accountId && newPay.netSalary > 0) {
        const autoExp = {
          id: uid("tx"),
          type: "expense",
          accountId: newPay.accountId,
          amount: newPay.netSalary,
          category: "Gaji & Upah Karyawan",
          date: newPay.paymentDate || todayISO(),
          notes: `Pembayaran Payroll Periode ${newPay.period} (${newPay.employeeName})`,
        };
        updatedTransactions = [autoExp, ...updatedTransactions];
      }

      return {
        ...prev,
        payroll: [newPay, ...prev.payroll],
        transactions: updatedTransactions,
      };
    });

    return newPay;
  }, []);

  const deletePayroll = useCallback((id) => {
    setData((prev) => ({
      ...prev,
      payroll: prev.payroll.filter((p) => p.id !== id),
    }));
  }, []);

  // Utilitas
  const exportJSON = useCallback(() => {
    exportDataToJSON(data);
  }, [data]);

  const importJSON = useCallback((importedData) => {
    if (!importedData || typeof importedData !== "object") {
      throw new Error("Format berkas JSON tidak valid.");
    }
    const cleanData = {
      ...getInitialData(),
      ...importedData,
    };
    setData(cleanData);
    saveLocalData(cleanData);
  }, []);

  const exportCSV = useCallback(() => {
    exportTransactionsToCSV(data.transactions, data.accounts);
  }, [data.transactions, data.accounts]);

  const resetAllData = useCallback(() => {
    const initial = getInitialData();
    setData(initial);
    saveLocalData(initial);
  }, []);

  // ================= COMPUTED VALUES =================

  const accountBalances = useMemo(() => {
    return calculateAccountBalances(data.accounts, data.transactions, data.transfers);
  }, [data.accounts, data.transactions, data.transfers]);

  const netWorthSummary = useMemo(() => {
    return calculateNetWorth(accountBalances);
  }, [accountBalances]);

  const inventoryValuation = useMemo(() => {
    return calculateInventoryValuation(data.products);
  }, [data.products]);

  const monthlyTrends = useMemo(() => {
    return calculateMonthlyTrends(data.transactions);
  }, [data.transactions]);

  // Helper Finders
  const getAccountName = useCallback(
    (id) => data.accounts.find((a) => a.id === id)?.name || "Rekening Tidak Ditemukan",
    [data.accounts]
  );

  const getClientName = useCallback(
    (id) => data.clients.find((c) => c.id === id)?.name || "Klien Umum",
    [data.clients]
  );

  const getEmployeeName = useCallback(
    (id) => data.employees.find((e) => e.id === id)?.name || "Karyawan",
    [data.employees]
  );

  const value = {
    isLoaded,
    user,
    // Raw state
    profile: data.profile,
    accounts: data.accounts,
    transactions: data.transactions,
    transfers: data.transfers,
    clients: data.clients,
    products: data.products,
    orders: data.orders,
    employees: data.employees,
    attendance: data.attendance,
    payroll: data.payroll,

    // Computed
    accountBalances,
    netWorthSummary,
    inventoryValuation,
    monthlyTrends,

    // Actions
    updateProfile,
    addAccount,
    updateAccount,
    deleteAccount,
    addTransaction,
    deleteTransaction,
    addTransfer,
    deleteTransfer,
    addClient,
    updateClient,
    deleteClient,
    addProduct,
    updateProduct,
    adjustStock,
    deleteProduct,
    addOrder,
    updateOrderStatus,
    updatePaymentStatus,
    deleteOrder,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    addAttendance,
    deleteAttendance,
    addPayroll,
    deletePayroll,

    // Utilities & Helpers
    getAccountName,
    getClientName,
    getEmployeeName,
    exportJSON,
    importJSON,
    exportCSV,
    resetAllData,
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error("useFinance harus digunakan di dalam FinanceProvider.");
  }
  return context;
}
