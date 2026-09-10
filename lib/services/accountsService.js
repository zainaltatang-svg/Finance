import { supabase } from "../supabase";
import { uid } from "../formatters";

export const mapAccountFromDB = (row) => ({
  id: row.id,
  name: row.name,
  type: row.type,
  accountNumber: row.account_number || "-",
  initialBalance: Number(row.initial_balance) || 0,
  createdAt: row.created_at,
});

export const mapAccountToDB = (account, userId) => ({
  id: account.id || uid(),
  user_id: userId,
  name: account.name,
  type: account.type,
  account_number: account.accountNumber || "-",
  initial_balance: Number(account.initialBalance) || 0,
});

export const accountsService = {
  async fetchAccounts() {
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw error;
    return (data || []).map(mapAccountFromDB);
  },

  async createAccount(account, userId) {
    const row = mapAccountToDB(account, userId);
    const { data, error } = await supabase
      .from("accounts")
      .insert(row)
      .select()
      .single();

    if (error) throw error;
    return mapAccountFromDB(data);
  },

  async updateAccount(id, updates) {
    const payload = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.type !== undefined) payload.type = updates.type;
    if (updates.accountNumber !== undefined) payload.account_number = updates.accountNumber;
    if (updates.initialBalance !== undefined) payload.initial_balance = Number(updates.initialBalance);

    const { data, error } = await supabase
      .from("accounts")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return mapAccountFromDB(data);
  },

  async deleteAccount(id) {
    const { error } = await supabase.from("accounts").delete().eq("id", id);
    if (error) throw error;
    return true;
  },
};
