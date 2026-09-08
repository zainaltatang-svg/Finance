/**
 * Menghitung saldo setiap rekening berdasarkan saldo awal, pemasukan, pengeluaran, dan mutasi transfer.
 */
export const calculateAccountBalances = (accounts = [], transactions = [], transfers = []) => {
  return accounts.map((account) => {
    // Pemasukan ke rekening ini
    const totalIncome = transactions
      .filter((t) => t.type === "income" && t.accountId === account.id)
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    // Pengeluaran dari rekening ini
    const totalExpense = transactions
      .filter((t) => t.type === "expense" && t.accountId === account.id)
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    // Transfer masuk ke rekening ini
    const transferIn = transfers
      .filter((tr) => tr.toAccountId === account.id)
      .reduce((sum, tr) => sum + (Number(tr.amount) || 0), 0);

    // Transfer keluar dari rekening ini
    const transferOut = transfers
      .filter((tr) => tr.fromAccountId === account.id)
      .reduce((sum, tr) => sum + (Number(tr.amount) || 0), 0);

    const initial = Number(account.initialBalance) || 0;
    const currentBalance = initial + totalIncome - totalExpense + transferIn - transferOut;

    return {
      ...account,
      currentBalance,
      totalIncome,
      totalExpense,
      transferIn,
      transferOut,
    };
  });
};

/**
 * Menghitung Nilai Bersih (Net Worth): Total Kas/Bank/Aset - Total Kewajiban (misal Kartu Kredit)
 */
export const calculateNetWorth = (balances = []) => {
  const assets = balances
    .filter((acc) => acc.type !== "Kartu Kredit")
    .reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);

  const liabilities = balances
    .filter((acc) => acc.type === "Kartu Kredit")
    .reduce((sum, acc) => sum + Math.max(0, acc.currentBalance || 0), 0);

  return {
    totalAssets: assets,
    totalLiabilities: liabilities,
    netWorth: assets - liabilities,
  };
};

/**
 * Menghitung Laporan Laba Rugi (Profit & Loss / P&L)
 */
export const calculatePnL = (transactions = [], startDate, endDate) => {
  const filtered = transactions.filter((t) => {
    if (!t.date) return false;
    if (startDate && t.date < startDate) return false;
    if (endDate && t.date > endDate) return false;
    return true;
  });

  const incomes = filtered.filter((t) => t.type === "income");
  const expenses = filtered.filter((t) => t.type === "expense");

  const totalRevenue = incomes.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  
  // HPP / COGS
  const cogs = expenses
    .filter((t) => t.category === "Beban Pokok Penjualan (HPP)")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const grossProfit = totalRevenue - cogs;

  // Beban Operasional lainnya
  const operationalExpenses = expenses
    .filter((t) => t.category !== "Beban Pokok Penjualan (HPP)")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalExpenses = cogs + operationalExpenses;
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Breakdown per kategori pengeluaran
  const expenseByCategory = expenses.reduce((acc, t) => {
    const cat = t.category || "Lain-lain";
    acc[cat] = (acc[cat] || 0) + (Number(t.amount) || 0);
    return acc;
  }, {});

  // Breakdown per kategori pendapatan
  const incomeByCategory = incomes.reduce((acc, t) => {
    const cat = t.category || "Lain-lain";
    acc[cat] = (acc[cat] || 0) + (Number(t.amount) || 0);
    return acc;
  }, {});

  return {
    totalRevenue,
    cogs,
    grossProfit,
    operationalExpenses,
    totalExpenses,
    netProfit,
    profitMargin,
    expenseByCategory,
    incomeByCategory,
    transactionCount: filtered.length,
  };
};

/**
 * Valuasi Aset Stok Barang Inventori
 */
export const calculateInventoryValuation = (products = []) => {
  let totalStockQty = 0;
  let totalCostValuation = 0; // Berdasarkan harga beli/modal
  let totalRetailValuation = 0; // Berdasarkan harga jual

  products.forEach((p) => {
    const qty = Math.max(0, Number(p.stock) || 0);
    const cost = Number(p.costPrice || p.price || 0);
    const price = Number(p.price) || 0;

    totalStockQty += qty;
    totalCostValuation += qty * cost;
    totalRetailValuation += qty * price;
  });

  return {
    totalItems: products.length,
    totalStockQty,
    totalCostValuation,
    totalRetailValuation,
    potentialProfit: totalRetailValuation - totalCostValuation,
  };
};

/**
 * Ringkasan Arus Kas untuk grafik 6 bulan terakhir
 */
export const calculateMonthlyTrends = (transactions = []) => {
  const months = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yearMonth = d.toISOString().slice(0, 7);
    const monthName = d.toLocaleDateString("id-ID", { month: "short" });

    const monthIncome = transactions
      .filter((t) => t.type === "income" && t.date && t.date.startsWith(yearMonth))
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const monthExpense = transactions
      .filter((t) => t.type === "expense" && t.date && t.date.startsWith(yearMonth))
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    months.push({
      yearMonth,
      monthName,
      income: monthIncome,
      expense: monthExpense,
      net: monthIncome - monthExpense,
    });
  }

  return months;
};
