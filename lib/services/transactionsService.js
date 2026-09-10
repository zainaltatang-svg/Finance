import { supabase } from "../supabase";
import { uid, todayISO } from "../formatters";

export const mapTransactionFromDB = (row) => ({
  id: row.id,
  accountId: row.account_id,
  type: row.type,
  amount: Number(row.amount) || 0,
  category: row.category,
  date: row.date,
  notes: row.notes || "",
  orderId: row.order_id || null,
  payrollId: row.payroll_id || null,
  createdAt: row.created_at,
});

export const mapTransactionToDB = (tx, userId) => ({
  id: tx.id || uid(),
  user_id: userId,
  account_id: tx.accountId,
  type: tx.type,
  amount: Number(tx.amount) || 0,
  category: tx.category,
  date: tx.date || todayISO(),
  notes: tx.notes || "",
  order_id: tx.orderId || null,
  payroll_id: tx.payrollId || null,
});

export const mapTransferFromDB = (row) => ({
  id: row.id,
  fromAccountId: row.from_account_id,
  toAccountId: row.to_account_id,
  amount: Number(row.amount) || 0,
  date: row.date,
  notes: row.notes || "",
  createdAt: row.created_at,
});

export const mapTransferToDB = (tr, userId) => ({
  id: tr.id || uid(),
  user_id: userId,
  from_account_id: tr.fromAccountId,
  to_account_id: tr.toAccountId,
  amount: Number(tr.amount) || 0,
  date: tr.date || todayISO(),
  notes: tr.notes || "",
});

export const transactionsService = {
  // Transaksi
  async fetchTransactions() {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(mapTransactionFromDB);
  },

  async createTransaction(tx, userId) {
    const row = mapTransactionToDB(tx, userId);
    const { data, error } = await supabase
      .from("transactions")
      .insert(row)
      .select()
      .single();

    if (error) throw error;
    return mapTransactionFromDB(data);
  },

  async deleteTransaction(id) {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) throw error;
    return true;
  },

  async deleteTransactionByOrderId(orderId) {
    const { error } = await supabase.from("transactions").delete().eq("order_id", orderId);
    if (error) throw error;
    return true;
  },

  async deleteTransactionByPayrollId(payrollId) {
    const { error } = await supabase.from("transactions").delete().eq("payroll_id", payrollId);
    if (error) throw error;
    return true;
  },

  // Transfer
  async fetchTransfers() {
    const { data, error } = await supabase
      .from("transfers")
      .select("*")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(mapTransferFromDB);
  },

  async createTransfer(tr, userId) {
    const row = mapTransferToDB(tr, userId);
    const { data, error } = await supabase
      .from("transfers")
      .insert(row)
      .select()
      .single();

    if (error) throw error;
    return mapTransferFromDB(data);
  },

  async deleteTransfer(id) {
    const { error } = await supabase.from("transfers").delete().eq("id", id);
    if (error) throw error;
    return true;
  },
};
