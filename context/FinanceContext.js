"use client";

import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  loadLocalData,
  saveLocalData,
  exportDataToJSON,
  exportTransactionsToCSV,
  getInitialData,
  getBlankData,
} from "../lib/storage";
import {
  calculateAccountBalances,
  calculateNetWorth,
  calculateInventoryValuation,
  calculateMonthlyTrends,
} from "../lib/calculations";
import { uid, todayISO } from "../lib/formatters";
import { supabase } from "../lib/supabase";
import { accountsService } from "../lib/services/accountsService";
import { transactionsService } from "../lib/services/transactionsService";
import { salesService } from "../lib/services/salesService";
import { inventoryService } from "../lib/services/inventoryService";
import { employeesService } from "../lib/services/employeesService";
import { profileService } from "../lib/services/profileService";
import { migrationService } from "../lib/services/migrationService";

const FinanceContext = createContext(null);

export function FinanceProvider({ children }) {
  const [data, setData] = useState(getInitialData);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [user, setUser] = useState(null);

  // Refs untuk throttling, deduplikasi request, dan menjaga kestabilan referensi
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const activeUserRef = useRef(user);

  useEffect(() => {
    activeUserRef.current = user;
  }, [user]);

  // 1. Sinkronkan data dari cloud Supabase dengan guard deduplikasi & cooldown
  const fetchCloudData = useCallback(async (forcedUser = null, forceRefresh = false) => {
    const activeUser = forcedUser || activeUserRef.current;
    if (!activeUser) return;

    const now = Date.now();
    // Cegah penembakan request simultan atau berulang jika belum 4 detik (kecuali forceRefresh)
    if (isFetchingRef.current) return;
    if (!forceRefresh && now - lastFetchTimeRef.current < 4000) return;

    isFetchingRef.current = true;
    lastFetchTimeRef.current = now;
    setIsSyncing(true);

    try {
      const [
        accs,
        txs,
        trs,
        cls,
        prods,
        ords,
        emps,
        atts,
        pays,
        prof,
      ] = await Promise.allSettled([
        accountsService.fetchAccounts(),
        transactionsService.fetchTransactions(),
        transactionsService.fetchTransfers(),
        salesService.fetchClients(),
        inventoryService.fetchProducts(),
        salesService.fetchOrders(),
        employeesService.fetchEmployees(),
        employeesService.fetchAttendance(),
        employeesService.fetchPayroll(),
        profileService.fetchProfile(activeUser.id),
      ]);

      setData((prev) => ({
        ...prev,
        accounts: accs.status === "fulfilled" ? accs.value : prev.accounts,
        transactions: txs.status === "fulfilled" ? txs.value : prev.transactions,
        transfers: trs.status === "fulfilled" ? trs.value : prev.transfers,
        clients: cls.status === "fulfilled" ? cls.value : prev.clients,
        products: prods.status === "fulfilled" ? prods.value : prev.products,
        orders: ords.status === "fulfilled" ? ords.value : prev.orders,
        employees: emps.status === "fulfilled" ? emps.value : prev.employees,
        attendance: atts.status === "fulfilled" ? atts.value : prev.attendance,
        payroll: pays.status === "fulfilled" ? pays.value : prev.payroll,
        profile: prof.status === "fulfilled" && prof.value ? prof.value : prev.profile,
      }));
    } catch (err) {
      console.warn("Sinkronisasi cloud tertunda, menggunakan cache lokal:", err);
    } finally {
      isFetchingRef.current = false;
      setIsSyncing(false);
    }
  }, []);

  // 2. Inisialisasi sesi pengguna & muat cache lokal (Dijalankan SEKALI saat mount)
  useEffect(() => {
    let isMounted = true;

    if (supabase) {
      // Muat sesi awal secara langsung
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!isMounted) return;
        const activeUser = session?.user || null;
        setUser(activeUser);
        const loaded = loadLocalData(activeUser?.id);
        setData(loaded);
        setIsLoaded(true);

        if (activeUser) {
          fetchCloudData(activeUser);
        }
      });

      // Dengarkan perubahan otentikasi (hanya fetch jika login baru / user berganti)
      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (!isMounted) return;
        const activeUser = session?.user || null;
        setUser(activeUser);

        if (activeUser) {
          if (event === "SIGNED_IN") {
            const loaded = loadLocalData(activeUser.id);
            setData(loaded);
            fetchCloudData(activeUser);
          }
        } else if (event === "SIGNED_OUT") {
          setData(getInitialData());
        }
      });

      return () => {
        isMounted = false;
        authListener?.subscription?.unsubscribe();
      };
    } else {
      Promise.resolve().then(() => {
        if (!isMounted) return;
        const loaded = loadLocalData(null);
        setData(loaded);
        setIsLoaded(true);
      });
    }
  }, [fetchCloudData]);

  // 3. Simpan otomatis ke localStorage dengan DEBOUNCE (Mencegah blocking synchronous I/O)
  useEffect(() => {
    if (!isLoaded) return;
    const timer = setTimeout(() => {
      saveLocalData(data, user?.id || null);
    }, 400);

    return () => clearTimeout(timer);
  }, [data, isLoaded, user?.id]);

  // Seeder Data Contoh ke Database Cloud
  const seedCloudData = useCallback(async () => {
    if (!user) {
      throw new Error("Silakan masuk terlebih dahulu untuk mengisi data contoh ke cloud.");
    }
    setIsSyncing(true);
    try {
      await migrationService.seedDefaultBusinessDataToCloud(user.id);
      await fetchCloudData(user);
    } finally {
      setIsSyncing(false);
    }
  }, [user, fetchCloudData]);

  // Cek apakah database cloud user saat ini masih kosong
  const isCloudEmpty = useMemo(() => {
    if (!user) return false;
    return (
      (data.accounts?.length || 0) === 0 &&
      (data.products?.length || 0) === 0 &&
      (data.transactions?.length || 0) === 0 &&
      (data.clients?.length || 0) === 0
    );
  }, [user, data]);

  // ================= ACTIONS ASINKRON CLOUD =================

  // Profil
  const updateProfile = useCallback(async (profileUpdates) => {
    if (!user) {
      setData((prev) => {
        const next = { ...prev, profile: { ...prev.profile, ...profileUpdates } };
        saveLocalData(next, null);
        return next;
      });
      return;
    }

    try {
      const saved = await profileService.upsertProfile(profileUpdates, user.id);
      setData((prev) => {
        const next = { ...prev, profile: saved || { ...prev.profile, ...profileUpdates } };
        saveLocalData(next, user.id);
        return next;
      });
      return saved;
    } catch (err) {
      console.error("Gagal simpan profil ke Supabase:", err);
      throw err;
    }
  }, [user]);

  // Rekening Bank & Kas
  const addAccount = useCallback(async (account) => {
    const tempAccount = {
      id: uid(),
      initialBalance: 0,
      accountNumber: "-",
      ...account,
    };

    if (!user) {
      setData((prev) => {
        const next = { ...prev, accounts: [...prev.accounts, tempAccount] };
        saveLocalData(next, null);
        return next;
      });
      return tempAccount;
    }

    try {
      const created = await accountsService.createAccount(tempAccount, user.id);
      setData((prev) => {
        const next = { ...prev, accounts: [...prev.accounts, created] };
        saveLocalData(next, user.id);
        return next;
      });
      return created;
    } catch (err) {
      console.error("Gagal simpan rekening ke cloud:", err);
      throw err;
    }
  }, [user]);

  const updateAccount = useCallback(async (id, updates) => {
    if (!user) {
      setData((prev) => {
        const next = {
          ...prev,
          accounts: prev.accounts.map((acc) => (acc.id === id ? { ...acc, ...updates } : acc)),
        };
        saveLocalData(next, null);
        return next;
      });
      return;
    }

    try {
      const updated = await accountsService.updateAccount(id, updates);
      setData((prev) => {
        const next = {
          ...prev,
          accounts: prev.accounts.map((acc) => (acc.id === id ? updated : acc)),
        };
        saveLocalData(next, user.id);
        return next;
      });
      return updated;
    } catch (err) {
      console.error("Gagal perbarui rekening di cloud:", err);
      throw err;
    }
  }, [user]);

  const deleteAccount = useCallback(async (id) => {
    if (!user) {
      setData((prev) => {
        const next = {
          ...prev,
          accounts: prev.accounts.filter((acc) => acc.id !== id),
          transactions: prev.transactions.filter((tx) => tx.accountId !== id),
          transfers: prev.transfers.filter((tr) => tr.fromAccountId !== id && tr.toAccountId !== id),
        };
        saveLocalData(next, null);
        return next;
      });
      return;
    }

    try {
      await accountsService.deleteAccount(id);
      setData((prev) => {
        const next = {
          ...prev,
          accounts: prev.accounts.filter((acc) => acc.id !== id),
          transactions: prev.transactions.filter((tx) => tx.accountId !== id),
          transfers: prev.transfers.filter((tr) => tr.fromAccountId !== id && tr.toAccountId !== id),
        };
        saveLocalData(next, user.id);
        return next;
      });
    } catch (err) {
      console.error("Gagal hapus rekening di cloud:", err);
      throw err;
    }
  }, [user]);

  // Transaksi Pemasukan & Pengeluaran
  const addTransaction = useCallback(async (tx) => {
    const newTx = {
      id: uid(),
      date: todayISO(),
      ...tx,
    };

    if (!user) {
      setData((prev) => {
        const next = { ...prev, transactions: [newTx, ...prev.transactions] };
        saveLocalData(next, null);
        return next;
      });
      return newTx;
    }

    try {
      const created = await transactionsService.createTransaction(newTx, user.id);
      setData((prev) => {
        const next = { ...prev, transactions: [created, ...prev.transactions] };
        saveLocalData(next, user.id);
        return next;
      });
      return created;
    } catch (err) {
      console.error("Gagal simpan transaksi ke cloud:", err);
      throw err;
    }
  }, [user]);

  const deleteTransaction = useCallback(async (id) => {
    if (!user) {
      setData((prev) => {
        const next = { ...prev, transactions: prev.transactions.filter((tx) => tx.id !== id) };
        saveLocalData(next, null);
        return next;
      });
      return;
    }

    try {
      await transactionsService.deleteTransaction(id);
      setData((prev) => {
        const next = { ...prev, transactions: prev.transactions.filter((tx) => tx.id !== id) };
        saveLocalData(next, user.id);
        return next;
      });
    } catch (err) {
      console.error("Gagal hapus transaksi di cloud:", err);
      throw err;
    }
  }, [user]);

  // Transfer Antar Rekening
  const addTransfer = useCallback(async (transfer) => {
    const newTr = {
      id: uid(),
      date: todayISO(),
      ...transfer,
    };

    if (!user) {
      setData((prev) => {
        const next = { ...prev, transfers: [newTr, ...prev.transfers] };
        saveLocalData(next, null);
        return next;
      });
      return newTr;
    }

    try {
      const created = await transactionsService.createTransfer(newTr, user.id);
      setData((prev) => {
        const next = { ...prev, transfers: [created, ...prev.transfers] };
        saveLocalData(next, user.id);
        return next;
      });
      return created;
    } catch (err) {
      console.error("Gagal simpan transfer ke cloud:", err);
      throw err;
    }
  }, [user]);

  const deleteTransfer = useCallback(async (id) => {
    if (!user) {
      setData((prev) => {
        const next = { ...prev, transfers: prev.transfers.filter((tr) => tr.id !== id) };
        saveLocalData(next, null);
        return next;
      });
      return;
    }

    try {
      await transactionsService.deleteTransfer(id);
      setData((prev) => {
        const next = { ...prev, transfers: prev.transfers.filter((tr) => tr.id !== id) };
        saveLocalData(next, user.id);
        return next;
      });
    } catch (err) {
      console.error("Gagal hapus transfer di cloud:", err);
      throw err;
    }
  }, [user]);

  // Klien / Pelanggan
  const addClient = useCallback(async (client) => {
    const newClient = {
      id: uid(),
      ...client,
    };

    if (!user) {
      setData((prev) => {
        const next = { ...prev, clients: [...prev.clients, newClient] };
        saveLocalData(next, null);
        return next;
      });
      return newClient;
    }

    try {
      const created = await salesService.createClient(newClient, user.id);
      setData((prev) => {
        const next = { ...prev, clients: [...prev.clients, created] };
        saveLocalData(next, user.id);
        return next;
      });
      return created;
    } catch (err) {
      console.error("Gagal simpan klien ke cloud:", err);
      throw err;
    }
  }, [user]);

  const updateClient = useCallback(async (id, updates) => {
    if (!user) {
      setData((prev) => {
        const next = {
          ...prev,
          clients: prev.clients.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        };
        saveLocalData(next, null);
        return next;
      });
      return;
    }

    try {
      const updated = await salesService.updateClient(id, updates);
      setData((prev) => {
        const next = {
          ...prev,
          clients: prev.clients.map((c) => (c.id === id ? updated : c)),
        };
        saveLocalData(next, user.id);
        return next;
      });
      return updated;
    } catch (err) {
      console.error("Gagal perbarui klien di cloud:", err);
      throw err;
    }
  }, [user]);

  const deleteClient = useCallback(async (id) => {
    if (!user) {
      setData((prev) => {
        const next = { ...prev, clients: prev.clients.filter((c) => c.id !== id) };
        saveLocalData(next, null);
        return next;
      });
      return;
    }

    try {
      await salesService.deleteClient(id);
      setData((prev) => {
        const next = { ...prev, clients: prev.clients.filter((c) => c.id !== id) };
        saveLocalData(next, user.id);
        return next;
      });
    } catch (err) {
      console.error("Gagal hapus klien di cloud:", err);
      throw err;
    }
  }, [user]);

  // Produk & Stok
  const addProduct = useCallback(async (product) => {
    const newProd = {
      id: uid(),
      minStock: 5,
      ...product,
    };

    if (!user) {
      setData((prev) => {
        const next = { ...prev, products: [...prev.products, newProd] };
        saveLocalData(next, null);
        return next;
      });
      return newProd;
    }

    try {
      const created = await inventoryService.createProduct(newProd, user.id);
      setData((prev) => {
        const next = { ...prev, products: [...prev.products, created] };
        saveLocalData(next, user.id);
        return next;
      });
      return created;
    } catch (err) {
      console.error("Gagal simpan produk ke cloud:", err);
      throw err;
    }
  }, [user]);

  const updateProduct = useCallback(async (id, updates) => {
    if (!user) {
      setData((prev) => {
        const next = {
          ...prev,
          products: prev.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        };
        saveLocalData(next, null);
        return next;
      });
      return;
    }

    try {
      const updated = await inventoryService.updateProduct(id, updates);
      setData((prev) => {
        const next = {
          ...prev,
          products: prev.products.map((p) => (p.id === id ? updated : p)),
        };
        saveLocalData(next, user.id);
        return next;
      });
      return updated;
    } catch (err) {
      console.error("Gagal perbarui produk di cloud:", err);
      throw err;
    }
  }, [user]);

  const adjustStock = useCallback(async (id, newStock) => {
    const stockVal = Number(newStock) || 0;
    if (!user) {
      setData((prev) => {
        const next = {
          ...prev,
          products: prev.products.map((p) => (p.id === id ? { ...p, stock: stockVal } : p)),
        };
        saveLocalData(next, null);
        return next;
      });
      return;
    }

    try {
      const updated = await inventoryService.adjustStock(id, stockVal);
      setData((prev) => {
        const next = {
          ...prev,
          products: prev.products.map((p) => (p.id === id ? updated : p)),
        };
        saveLocalData(next, user.id);
        return next;
      });
    } catch (err) {
      console.error("Gagal sesuaikan stok di cloud:", err);
      throw err;
    }
  }, [user]);

  const deleteProduct = useCallback(async (id) => {
    if (!user) {
      setData((prev) => {
        const next = { ...prev, products: prev.products.filter((p) => p.id !== id) };
        saveLocalData(next, null);
        return next;
      });
      return;
    }

    try {
      await inventoryService.deleteProduct(id);
      setData((prev) => {
        const next = { ...prev, products: prev.products.filter((p) => p.id !== id) };
        saveLocalData(next, user.id);
        return next;
      });
    } catch (err) {
      console.error("Gagal hapus produk di cloud:", err);
      throw err;
    }
  }, [user]);

  // Pesanan & Invoice
  const addOrder = useCallback(async (order) => {
    // 1. Agregasi kuantitas per productId (F03: atasi bug stok berulang pada multi-baris invoice)
    const qtyMap = {};
    for (const item of order.items || []) {
      if (item.productId) {
        qtyMap[item.productId] = (qtyMap[item.productId] || 0) + Number(item.qty || 0);
      }
    }

    // 2. Validasi ketersediaan stok fisik sebelum pesanan disetujui (F03: cegah over-selling)
    for (const [prodId, requiredQty] of Object.entries(qtyMap)) {
      const prod = data.products.find((p) => p.id === prodId);
      if (prod && prod.type !== "service") {
        const availableStock = Number(prod.stock || 0);
        if (availableStock < requiredQty) {
          throw new Error(
            `Stok untuk produk "${prod.name}" tidak mencukupi. Tersedia: ${availableStock}, diminta: ${requiredQty}.`
          );
        }
      }
    }

    const newOrder = {
      id: uid(),
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`,
      date: todayISO(),
      ...order,
    };

    if (!user) {
      setData((prev) => {
        const updatedProducts = prev.products.map((prod) => {
          const qtyToDeduct = qtyMap[prod.id] || 0;
          if (qtyToDeduct > 0 && prod.type !== "service") {
            return {
              ...prod,
              stock: Math.max(0, Number(prod.stock || 0) - qtyToDeduct),
            };
          }
          return prod;
        });

        let updatedTransactions = prev.transactions;
        if (newOrder.paymentStatus === "Lunas" && newOrder.paidAccountId) {
          const hasOnlyServices = newOrder.items?.length > 0 && newOrder.items.every((it) => {
            const p = prev.products.find((prod) => prod.id === it.productId);
            return p?.type === "service";
          });

          const autoTx = {
            id: uid(),
            orderId: newOrder.id,
            type: "income",
            accountId: newOrder.paidAccountId,
            amount: newOrder.grandTotal,
            category: hasOnlyServices ? "Pendapatan Jasa / Layanan" : "Penjualan Produk",
            date: newOrder.date || todayISO(),
            notes: `Pembayaran Pelunasan ${newOrder.invoiceNumber} (${newOrder.clientName || "Klien"})`,
          };
          updatedTransactions = [autoTx, ...updatedTransactions];
        }

        const next = {
          ...prev,
          products: updatedProducts,
          orders: [newOrder, ...prev.orders],
          transactions: updatedTransactions,
        };
        saveLocalData(next, null);
        return next;
      });
      return newOrder;
    }

    // MODE CLOUD: Transaksi Atomik Terpadu (F01)
    let createdOrder = null;
    let createdTx = null;
    const adjustedProducts = [];

    try {
      // Step A: Buat Order Header & Items di cloud
      createdOrder = await salesService.createOrder(newOrder, user.id);

      // Step B: Jika status Lunas, buat transaksi kas pendamping
      if (newOrder.paymentStatus === "Lunas" && newOrder.paidAccountId) {
        const hasOnlyServices = newOrder.items?.length > 0 && newOrder.items.every((it) => {
          const p = data.products.find((prod) => prod.id === it.productId);
          return p?.type === "service";
        });

        const autoTx = {
          id: uid(),
          orderId: createdOrder.id,
          type: "income",
          accountId: newOrder.paidAccountId,
          amount: newOrder.grandTotal,
          category: hasOnlyServices ? "Pendapatan Jasa / Layanan" : "Penjualan Produk",
          date: newOrder.date || todayISO(),
          notes: `Pembayaran Pelunasan ${newOrder.invoiceNumber} (${newOrder.clientName || "Klien"})`,
        };
        createdTx = await transactionsService.createTransaction(autoTx, user.id);
      }

      // Step C: Kurangi stok produk fisik di cloud (1 kali per produk unik berdasarkan akumulasi qty)
      for (const [prodId, requiredQty] of Object.entries(qtyMap)) {
        const currentProd = data.products.find((p) => p.id === prodId);
        if (currentProd && currentProd.type !== "service") {
          const prevStock = Number(currentProd.stock || 0);
          const newStock = Math.max(0, prevStock - requiredQty);
          await inventoryService.adjustStock(prodId, newStock);
          adjustedProducts.push({ id: prodId, prevStock });
        }
      }

      // Step D: Seluruh mutasi cloud sukses -> Update state lokal & cache
      setData((prev) => {
        const updatedProducts = prev.products.map((prod) => {
          const qtyToDeduct = qtyMap[prod.id] || 0;
          if (qtyToDeduct > 0 && prod.type !== "service") {
            return { ...prod, stock: Math.max(0, Number(prod.stock || 0) - qtyToDeduct) };
          }
          return prod;
        });

        const next = {
          ...prev,
          products: updatedProducts,
          orders: [createdOrder, ...prev.orders],
          transactions: createdTx ? [createdTx, ...prev.transactions] : prev.transactions,
        };
        saveLocalData(next, user.id);
        return next;
      });

      return createdOrder;
    } catch (err) {
      console.error("Gagal simpan pesanan ke cloud, membatalkan mutasi parsial...", err);
      // COMPENSATING ROLLBACK JIKA GAGAL DI TENGAH JALAN (F01)
      if (createdTx) {
        await transactionsService.deleteTransaction(createdTx.id).catch(console.error);
      }
      for (const item of adjustedProducts) {
        await inventoryService.adjustStock(item.id, item.prevStock).catch(console.error);
      }
      if (createdOrder) {
        await salesService.deleteOrder(createdOrder.id).catch(console.error);
      }
      throw err;
    }
  }, [user, data.products]);

  const updateOrderStatus = useCallback(async (orderId, status) => {
    const order = data.orders.find((o) => o.id === orderId);
    if (!order) throw new Error("Pesanan tidak ditemukan.");
    if (order.status === status) return;

    const oldStatus = order.status;
    const isCancelling = status === "Dibatalkan" && oldStatus !== "Dibatalkan";
    const isReactivating = oldStatus === "Dibatalkan" && status !== "Dibatalkan";

    const qtyMap = {};
    if (order.items) {
      for (const it of order.items) {
        if (it.productId) {
          qtyMap[it.productId] = (qtyMap[it.productId] || 0) + Number(it.qty || 0);
        }
      }
    }

    if (!user) {
      setData((prev) => {
        let updatedProducts = prev.products;
        if (isCancelling) {
          // Pulihkan stok fisik
          updatedProducts = prev.products.map((prod) => {
            const restore = qtyMap[prod.id] || 0;
            if (restore > 0 && prod.type !== "service") {
              return { ...prod, stock: Number(prod.stock || 0) + restore };
            }
            return prod;
          });
        } else if (isReactivating) {
          // Kurangi kembali stok fisik
          updatedProducts = prev.products.map((prod) => {
            const deduct = qtyMap[prod.id] || 0;
            if (deduct > 0 && prod.type !== "service") {
              return { ...prod, stock: Math.max(0, Number(prod.stock || 0) - deduct) };
            }
            return prod;
          });
        }

        const next = {
          ...prev,
          products: updatedProducts,
          orders: prev.orders.map((o) => (o.id === orderId ? { ...o, status } : o)),
          transactions: isCancelling
            ? prev.transactions.filter((t) => t.orderId !== orderId)
            : prev.transactions,
        };
        saveLocalData(next, null);
        return next;
      });
      return;
    }

    try {
      // Lifecycle Pembatalan (F05)
      if (isCancelling) {
        for (const [prodId, restoreQty] of Object.entries(qtyMap)) {
          const prod = data.products.find((p) => p.id === prodId);
          if (prod && prod.type !== "service") {
            await inventoryService.adjustStock(prodId, Number(prod.stock || 0) + restoreQty);
          }
        }
        await transactionsService.deleteTransactionByOrderId(orderId).catch(console.error);
      } else if (isReactivating) {
        // Validasi dan kurangi kembali stok jika diaktifkan kembali
        for (const [prodId, deductQty] of Object.entries(qtyMap)) {
          const prod = data.products.find((p) => p.id === prodId);
          if (prod && prod.type !== "service") {
            await inventoryService.adjustStock(prodId, Math.max(0, Number(prod.stock || 0) - deductQty));
          }
        }
      }

      const updated = await salesService.updateOrderStatus(orderId, status);

      setData((prev) => {
        let updatedProducts = prev.products;
        if (isCancelling) {
          updatedProducts = prev.products.map((prod) => {
            const restore = qtyMap[prod.id] || 0;
            if (restore > 0 && prod.type !== "service") {
              return { ...prod, stock: Number(prod.stock || 0) + restore };
            }
            return prod;
          });
        } else if (isReactivating) {
          updatedProducts = prev.products.map((prod) => {
            const deduct = qtyMap[prod.id] || 0;
            if (deduct > 0 && prod.type !== "service") {
              return { ...prod, stock: Math.max(0, Number(prod.stock || 0) - deduct) };
            }
            return prod;
          });
        }

        const next = {
          ...prev,
          products: updatedProducts,
          orders: prev.orders.map((o) => (o.id === orderId ? updated : o)),
          transactions: isCancelling
            ? prev.transactions.filter((t) => t.orderId !== orderId)
            : prev.transactions,
        };
        saveLocalData(next, user.id);
        return next;
      });
    } catch (err) {
      console.error("Gagal perbarui status pesanan:", err);
      throw err;
    }
  }, [user, data.orders, data.products]);

  const updatePaymentStatus = useCallback(async (orderId, paymentStatus, paidAccountId) => {
    const order = data.orders.find((o) => o.id === orderId);
    if (!order) throw new Error("Pesanan tidak ditemukan.");

    // Proteksi Pembayaran Ganda (F04)
    if (paymentStatus === "Lunas" && order.paymentStatus === "Lunas") {
      throw new Error(`Invoice ${order.invoiceNumber} sudah berstatus Lunas.`);
    }

    if (!user) {
      setData((prev) => {
        let updatedTransactions = prev.transactions;
        if (paymentStatus === "Lunas" && order.paymentStatus !== "Lunas" && paidAccountId) {
          const autoTx = {
            id: uid(),
            orderId: order.id,
            type: "income",
            accountId: paidAccountId,
            amount: order.grandTotal,
            category: "Penjualan Produk",
            date: todayISO(),
            notes: `Pelunasan Invoice ${order.invoiceNumber} (${order.clientName || "Klien"})`,
          };
          updatedTransactions = [autoTx, ...updatedTransactions];
        }

        const next = {
          ...prev,
          orders: prev.orders.map((o) =>
            o.id === orderId ? { ...o, paymentStatus, paidAccountId: paidAccountId || o.paidAccountId } : o
          ),
          transactions: updatedTransactions,
        };
        saveLocalData(next, null);
        return next;
      });
      return;
    }

    let createdTx = null;
    let paymentUpdated = false;

    try {
      const updated = await salesService.updatePaymentStatus(orderId, paymentStatus, paidAccountId);
      paymentUpdated = true;

      if (paymentStatus === "Lunas" && order.paymentStatus !== "Lunas" && paidAccountId) {
        const autoTx = {
          id: uid(),
          orderId: order.id,
          type: "income",
          accountId: paidAccountId,
          amount: order.grandTotal,
          category: "Penjualan Produk",
          date: todayISO(),
          notes: `Pelunasan Invoice ${order.invoiceNumber} (${order.clientName || "Klien"})`,
        };
        createdTx = await transactionsService.createTransaction(autoTx, user.id);
      }

      setData((prev) => {
        const next = {
          ...prev,
          orders: prev.orders.map((o) => (o.id === orderId ? updated : o)),
          transactions: createdTx ? [createdTx, ...prev.transactions] : prev.transactions,
        };
        saveLocalData(next, user.id);
        return next;
      });
    } catch (err) {
      console.error("Gagal perbarui status bayar:", err);
      // Rollback jika mutasi kas atau status gagal
      if (createdTx) {
        await transactionsService.deleteTransaction(createdTx.id).catch(console.error);
      }
      if (paymentUpdated) {
        await salesService.updatePaymentStatus(orderId, order.paymentStatus, order.paidAccountId).catch(console.error);
      }
      throw err;
    }
  }, [user, data.orders]);

  const deleteOrder = useCallback(async (orderId) => {
    const orderToDelete = data.orders.find((o) => o.id === orderId);
    if (!orderToDelete) return;

    // Hitung stok yang perlu dipulihkan (F05: otomatis pulihkan stok jika belum dibatalkan)
    const shouldRestoreStock = orderToDelete.status !== "Dibatalkan";
    const qtyToRestoreMap = {};
    if (shouldRestoreStock && orderToDelete.items) {
      for (const item of orderToDelete.items) {
        if (item.productId) {
          qtyToRestoreMap[item.productId] = (qtyToRestoreMap[item.productId] || 0) + Number(item.qty || 0);
        }
      }
    }

    if (!user) {
      setData((prev) => {
        const updatedProducts = prev.products.map((prod) => {
          const restoreQty = qtyToRestoreMap[prod.id] || 0;
          if (restoreQty > 0 && prod.type !== "service") {
            return { ...prod, stock: Number(prod.stock || 0) + restoreQty };
          }
          return prod;
        });

        const next = {
          ...prev,
          products: updatedProducts,
          orders: prev.orders.filter((o) => o.id !== orderId),
          transactions: prev.transactions.filter((t) => t.orderId !== orderId),
        };
        saveLocalData(next, null);
        return next;
      });
      return;
    }

    try {
      // 1. Pulihkan stok produk fisik di cloud
      for (const [prodId, restoreQty] of Object.entries(qtyToRestoreMap)) {
        const prod = data.products.find((p) => p.id === prodId);
        if (prod && prod.type !== "service") {
          await inventoryService.adjustStock(prodId, Number(prod.stock || 0) + restoreQty);
        }
      }

      // 2. Hapus transaksi kas pemasukan yang terhubung dengan invoice ini (F05)
      await transactionsService.deleteTransactionByOrderId(orderId).catch(console.error);

      // 3. Hapus order di cloud
      await salesService.deleteOrder(orderId);

      // 4. Update state lokal & cache
      setData((prev) => {
        const updatedProducts = prev.products.map((prod) => {
          const restoreQty = qtyToRestoreMap[prod.id] || 0;
          if (restoreQty > 0 && prod.type !== "service") {
            return { ...prod, stock: Number(prod.stock || 0) + restoreQty };
          }
          return prod;
        });

        const next = {
          ...prev,
          products: updatedProducts,
          orders: prev.orders.filter((o) => o.id !== orderId),
          transactions: prev.transactions.filter((t) => t.orderId !== orderId),
        };
        saveLocalData(next, user.id);
        return next;
      });
    } catch (err) {
      console.error("Gagal hapus pesanan di cloud:", err);
      throw err;
    }
  }, [user, data.orders, data.products]);

  // Karyawan
  const addEmployee = useCallback(async (employee) => {
    const newEmp = {
      id: uid(),
      status: "Aktif",
      joinDate: todayISO(),
      ...employee,
    };

    if (!user) {
      setData((prev) => {
        const next = { ...prev, employees: [...prev.employees, newEmp] };
        saveLocalData(next, null);
        return next;
      });
      return newEmp;
    }

    try {
      const created = await employeesService.createEmployee(newEmp, user.id);
      setData((prev) => {
        const next = { ...prev, employees: [...prev.employees, created] };
        saveLocalData(next, user.id);
        return next;
      });
      return created;
    } catch (err) {
      console.error("Gagal simpan karyawan ke cloud:", err);
      throw err;
    }
  }, [user]);

  const updateEmployee = useCallback(async (id, updates) => {
    if (!user) {
      setData((prev) => {
        const next = {
          ...prev,
          employees: prev.employees.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        };
        saveLocalData(next, null);
        return next;
      });
      return;
    }

    try {
      const updated = await employeesService.updateEmployee(id, updates);
      setData((prev) => {
        const next = {
          ...prev,
          employees: prev.employees.map((e) => (e.id === id ? updated : e)),
        };
        saveLocalData(next, user.id);
        return next;
      });
      return updated;
    } catch (err) {
      console.error("Gagal perbarui karyawan di cloud:", err);
      throw err;
    }
  }, [user]);

  const deleteEmployee = useCallback(async (id) => {
    if (!user) {
      setData((prev) => {
        const next = {
          ...prev,
          employees: prev.employees.filter((e) => e.id !== id),
          attendance: prev.attendance.filter((a) => a.employeeId !== id),
          payroll: prev.payroll.filter((p) => p.employeeId !== id),
        };
        saveLocalData(next, null);
        return next;
      });
      return;
    }

    try {
      await employeesService.deleteEmployee(id);
      setData((prev) => {
        const next = {
          ...prev,
          employees: prev.employees.filter((e) => e.id !== id),
          attendance: prev.attendance.filter((a) => a.employeeId !== id),
          payroll: prev.payroll.filter((p) => p.employeeId !== id),
        };
        saveLocalData(next, user.id);
        return next;
      });
    } catch (err) {
      console.error("Gagal hapus karyawan di cloud:", err);
      throw err;
    }
  }, [user]);

  // Absensi
  const addAttendance = useCallback(async (record) => {
    const newAtt = {
      id: uid(),
      date: todayISO(),
      status: "Hadir",
      ...record,
    };

    if (!user) {
      setData((prev) => {
        const next = { ...prev, attendance: [newAtt, ...prev.attendance] };
        saveLocalData(next, null);
        return next;
      });
      return newAtt;
    }

    try {
      const created = await employeesService.createAttendance(newAtt, user.id);
      setData((prev) => {
        const next = { ...prev, attendance: [created, ...prev.attendance] };
        saveLocalData(next, user.id);
        return next;
      });
      return created;
    } catch (err) {
      console.error("Gagal simpan absensi ke cloud:", err);
      throw err;
    }
  }, [user]);

  const deleteAttendance = useCallback(async (id) => {
    if (!user) {
      setData((prev) => {
        const next = { ...prev, attendance: prev.attendance.filter((a) => a.id !== id) };
        saveLocalData(next, null);
        return next;
      });
      return;
    }

    try {
      await employeesService.deleteAttendance(id);
      setData((prev) => {
        const next = { ...prev, attendance: prev.attendance.filter((a) => a.id !== id) };
        saveLocalData(next, user.id);
        return next;
      });
    } catch (err) {
      console.error("Gagal hapus absensi di cloud:", err);
      throw err;
    }
  }, [user]);

  // Penggajian (Payroll)
  const addPayroll = useCallback(async (record) => {
    const newPay = {
      id: uid(),
      paymentDate: todayISO(),
      status: "Dibayar",
      ...record,
    };

    if (!user) {
      let autoExp = null;
      if (newPay.accountId && newPay.netSalary > 0) {
        autoExp = {
          id: uid(),
          payrollId: newPay.id,
          type: "expense",
          accountId: newPay.accountId,
          amount: newPay.netSalary,
          category: "Gaji & Upah Karyawan",
          date: newPay.paymentDate || todayISO(),
          notes: `Pembayaran Payroll Periode ${newPay.period} (${newPay.employeeName})`,
        };
      }

      setData((prev) => {
        const next = {
          ...prev,
          payroll: [newPay, ...prev.payroll],
          transactions: autoExp ? [autoExp, ...prev.transactions] : prev.transactions,
        };
        saveLocalData(next, null);
        return next;
      });
      return newPay;
    }

    let createdPay = null;
    let createdTx = null;

    try {
      createdPay = await employeesService.createPayroll(newPay, user.id);

      if (newPay.accountId && newPay.netSalary > 0) {
        const autoExp = {
          id: uid(),
          payrollId: createdPay.id,
          type: "expense",
          accountId: newPay.accountId,
          amount: newPay.netSalary,
          category: "Gaji & Upah Karyawan",
          date: newPay.paymentDate || todayISO(),
          notes: `Pembayaran Payroll Periode ${newPay.period} (${newPay.employeeName})`,
        };
        createdTx = await transactionsService.createTransaction(autoExp, user.id);
      }

      setData((prev) => {
        const next = {
          ...prev,
          payroll: [createdPay, ...prev.payroll],
          transactions: createdTx ? [createdTx, ...prev.transactions] : prev.transactions,
        };
        saveLocalData(next, user.id);
        return next;
      });

      return createdPay;
    } catch (err) {
      console.error("Gagal simpan payroll ke cloud, membatalkan mutasi parsial...", err);
      // Rollback jika mutasi kas atau payroll gagal di tengah jalan (F01)
      if (createdTx) {
        await transactionsService.deleteTransaction(createdTx.id).catch(console.error);
      }
      if (createdPay) {
        await employeesService.deletePayroll(createdPay.id).catch(console.error);
      }
      throw err;
    }
  }, [user]);

  const deletePayroll = useCallback(async (id) => {
    if (!user) {
      setData((prev) => {
        const next = {
          ...prev,
          payroll: prev.payroll.filter((p) => p.id !== id),
          transactions: prev.transactions.filter((t) => t.payrollId !== id),
        };
        saveLocalData(next, null);
        return next;
      });
      return;
    }

    try {
      // Hapus transaksi kas pengeluaran gaji terkait (F05)
      await transactionsService.deleteTransactionByPayrollId(id).catch(console.error);
      await employeesService.deletePayroll(id);

      setData((prev) => {
        const next = {
          ...prev,
          payroll: prev.payroll.filter((p) => p.id !== id),
          transactions: prev.transactions.filter((t) => t.payrollId !== id),
        };
        saveLocalData(next, user.id);
        return next;
      });
    } catch (err) {
      console.error("Gagal hapus payroll di cloud:", err);
      throw err;
    }
  }, [user]);

  // Utilitas
  const exportJSON = useCallback(() => {
    exportDataToJSON(data);
  }, [data]);

  const importJSON = useCallback((importedData) => {
    if (!importedData || typeof importedData !== "object") {
      throw new Error("Format berkas JSON tidak valid.");
    }
    const cleanData = {
      ...(user ? getBlankData() : getInitialData()),
      ...importedData,
    };
    setData(cleanData);
    saveLocalData(cleanData, user?.id || null);
  }, [user]);

  const exportCSV = useCallback(() => {
    exportTransactionsToCSV(data.transactions, data.accounts);
  }, [data.transactions, data.accounts]);

  const resetAllData = useCallback(() => {
    const initial = user ? getBlankData() : getInitialData();
    setData(initial);
    saveLocalData(initial, user?.id || null);
  }, [user]);

  // ================= COMPUTED VALUES =================

  const accountBalances = useMemo(() => {
    return calculateAccountBalances(data.accounts || [], data.transactions || [], data.transfers || []);
  }, [data.accounts, data.transactions, data.transfers]);

  const netWorthSummary = useMemo(() => {
    return calculateNetWorth(accountBalances);
  }, [accountBalances]);

  const inventoryValuation = useMemo(() => {
    return calculateInventoryValuation(data.products || []);
  }, [data.products]);

  const monthlyTrends = useMemo(() => {
    return calculateMonthlyTrends(data.transactions || []);
  }, [data.transactions]);

  // Helper Finders
  const getAccountName = useCallback(
    (id) => (data.accounts || []).find((a) => a.id === id)?.name || "Rekening Tidak Ditemukan",
    [data.accounts]
  );

  const getClientName = useCallback(
    (id) => (data.clients || []).find((c) => c.id === id)?.name || "Klien Umum",
    [data.clients]
  );

  const getEmployeeName = useCallback(
    (id) => (data.employees || []).find((e) => e.id === id)?.name || "Karyawan",
    [data.employees]
  );

  const refreshCloudData = useCallback(() => {
    return fetchCloudData(activeUserRef.current, true);
  }, [fetchCloudData]);

  const value = useMemo(
    () => ({
      isLoaded,
      isSyncing,
      isCloudEmpty,
      user,
      refreshCloudData,
      seedCloudData,

      // Raw state
      profile: data.profile,
      accounts: data.accounts || [],
      transactions: data.transactions || [],
      transfers: data.transfers || [],
      clients: data.clients || [],
      products: data.products || [],
      orders: data.orders || [],
      employees: data.employees || [],
      attendance: data.attendance || [],
      payroll: data.payroll || [],

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
    }),
    [
      isLoaded,
      isSyncing,
      isCloudEmpty,
      user,
      data,
      accountBalances,
      netWorthSummary,
      inventoryValuation,
      monthlyTrends,
      refreshCloudData,
      seedCloudData,
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
      getAccountName,
      getClientName,
      getEmployeeName,
      exportJSON,
      importJSON,
      exportCSV,
      resetAllData,
    ]
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

// Master Hook (All-in-one backward compatible)
export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error("useFinance harus digunakan di dalam FinanceProvider.");
  }
  return context;
}

// Domain Sub-Hooks (Task 4.1 Modular State)
export function useAccounts() {
  const ctx = useFinance();
  return {
    accounts: ctx.accounts,
    accountBalances: ctx.accountBalances,
    netWorthSummary: ctx.netWorthSummary,
    addAccount: ctx.addAccount,
    updateAccount: ctx.updateAccount,
    deleteAccount: ctx.deleteAccount,
    getAccountName: ctx.getAccountName,
  };
}

export function useTransactions() {
  const ctx = useFinance();
  return {
    transactions: ctx.transactions,
    transfers: ctx.transfers,
    monthlyTrends: ctx.monthlyTrends,
    addTransaction: ctx.addTransaction,
    deleteTransaction: ctx.deleteTransaction,
    addTransfer: ctx.addTransfer,
    deleteTransfer: ctx.deleteTransfer,
  };
}

export function useInventory() {
  const ctx = useFinance();
  return {
    products: ctx.products,
    inventoryValuation: ctx.inventoryValuation,
    addProduct: ctx.addProduct,
    updateProduct: ctx.updateProduct,
    adjustStock: ctx.adjustStock,
    deleteProduct: ctx.deleteProduct,
  };
}

export function useSales() {
  const ctx = useFinance();
  return {
    clients: ctx.clients,
    orders: ctx.orders,
    addClient: ctx.addClient,
    updateClient: ctx.updateClient,
    deleteClient: ctx.deleteClient,
    addOrder: ctx.addOrder,
    updateOrderStatus: ctx.updateOrderStatus,
    updatePaymentStatus: ctx.updatePaymentStatus,
    deleteOrder: ctx.deleteOrder,
    getClientName: ctx.getClientName,
  };
}

export function useEmployees() {
  const ctx = useFinance();
  return {
    employees: ctx.employees,
    attendance: ctx.attendance,
    payroll: ctx.payroll,
    addEmployee: ctx.addEmployee,
    updateEmployee: ctx.updateEmployee,
    deleteEmployee: ctx.deleteEmployee,
    addAttendance: ctx.addAttendance,
    deleteAttendance: ctx.deleteAttendance,
    addPayroll: ctx.addPayroll,
    deletePayroll: ctx.deletePayroll,
    getEmployeeName: ctx.getEmployeeName,
  };
}
