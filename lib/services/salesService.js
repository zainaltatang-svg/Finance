import { supabase } from "../supabase";
import { uid, todayISO } from "../formatters";

export const mapClientFromDB = (row) => ({
  id: row.id,
  name: row.name,
  contact: row.contact_person || "",
  phone: row.phone || "",
  email: row.email || "",
  address: row.address || "",
  createdAt: row.created_at,
});

export const mapClientToDB = (c, userId) => ({
  id: c.id || uid(),
  user_id: userId,
  name: c.name,
  contact_person: c.contact || "",
  phone: c.phone || "",
  email: c.email || "",
  address: c.address || "",
});

export const mapOrderFromDB = (row) => ({
  id: row.id,
  invoiceNumber: row.invoice_number,
  clientId: row.client_id,
  clientName: row.client_name || row.clients?.name || "Klien Umum",
  clientAddress: row.client_address || "",
  paidAccountId: row.paid_account_id,
  date: row.date,
  dueDate: row.due_date,
  status: row.status,
  paymentStatus: row.payment_status,
  subtotal: Number(row.subtotal) || 0,
  discount: Number(row.discount) || 0,
  grandTotal: Number(row.grand_total) || 0,
  notes: row.notes || "",
  items: (row.order_items || []).map((it) => ({
    id: it.id,
    productId: it.product_id,
    productName: it.product_name,
    qty: Number(it.qty) || 1,
    price: Number(it.price) || 0,
    total: Number(it.total) || 0,
  })),
  createdAt: row.created_at,
});

export const salesService = {
  // Klien
  async fetchClients() {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw error;
    return (data || []).map(mapClientFromDB);
  },

  async createClient(client, userId) {
    const row = mapClientToDB(client, userId);
    const { data, error } = await supabase
      .from("clients")
      .insert(row)
      .select()
      .single();

    if (error) throw error;
    return mapClientFromDB(data);
  },

  async updateClient(id, updates) {
    const payload = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.contact !== undefined) payload.contact_person = updates.contact;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.email !== undefined) payload.email = updates.email;
    if (updates.address !== undefined) payload.address = updates.address;

    const { data, error } = await supabase
      .from("clients")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return mapClientFromDB(data);
  },

  async deleteClient(id) {
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) throw error;
    return true;
  },

  // Pesanan / Invoice
  async fetchOrders() {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*), clients(name)")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(mapOrderFromDB);
  },

  async createOrder(order, userId) {
    const orderId = order.id || uid();
    const orderRow = {
      id: orderId,
      user_id: userId,
      invoice_number: order.invoiceNumber || `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      client_id: order.clientId || null,
      client_name: order.clientName || null,
      client_address: order.clientAddress || null,
      paid_account_id: order.paidAccountId || null,
      date: order.date || todayISO(),
      due_date: order.dueDate || null,
      status: order.status || "Baru",
      payment_status: order.paymentStatus || "Belum Dibayar",
      subtotal: Number(order.subtotal) || 0,
      discount: Number(order.discount) || 0,
      grand_total: Number(order.grandTotal) || 0,
      notes: order.notes || "",
    };

    const { data: insertedOrder, error: orderError } = await supabase
      .from("orders")
      .insert(orderRow)
      .select("*, clients(name)")
      .single();

    if (orderError) throw orderError;

    // Masukkan items
    if (order.items && order.items.length > 0) {
      const itemsRows = order.items.map((it) => ({
        id: it.id || uid(),
        user_id: userId,
        order_id: orderId,
        product_id: it.productId || null,
        product_name: it.productName || "Item",
        qty: Number(it.qty) || 1,
        price: Number(it.price) || 0,
        total: Number(it.total) || 0,
      }));

      const { data: insertedItems, error: itemsError } = await supabase
        .from("order_items")
        .insert(itemsRows)
        .select();

      if (itemsError) {
        // Rollback header order untuk mencegah zombie record parsial jika item gagal
        await supabase.from("orders").delete().eq("id", orderId);
        throw itemsError;
      }
      insertedOrder.order_items = insertedItems;
    } else {
      insertedOrder.order_items = [];
    }

    return mapOrderFromDB(insertedOrder);
  },

  async updateOrderStatus(id, status) {
    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id)
      .select("*, order_items(*), clients(name)")
      .single();

    if (error) throw error;
    return mapOrderFromDB(data);
  },

  async updatePaymentStatus(id, paymentStatus, paidAccountId) {
    const payload = { payment_status: paymentStatus };
    if (paidAccountId !== undefined) payload.paid_account_id = paidAccountId;

    const { data, error } = await supabase
      .from("orders")
      .update(payload)
      .eq("id", id)
      .select("*, order_items(*), clients(name)")
      .single();

    if (error) throw error;
    return mapOrderFromDB(data);
  },

  async deleteOrder(id) {
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) throw error;
    return true;
  },
};
