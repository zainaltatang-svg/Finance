import { supabase } from "../supabase";
import { uid } from "../formatters";

export const mapProductFromDB = (row) => ({
  id: row.id,
  name: row.name,
  type: row.type || "product",
  category: row.category || "",
  unit: row.unit || (row.type === "service" ? "layanan" : "pcs"),
  description: row.description || "",
  sku: row.sku || "",
  costPrice: Number(row.cost_price) || 0,
  price: Number(row.price) || 0,
  stock: Number(row.stock) || 0,
  minStock: Number(row.min_stock) || 5,
  createdAt: row.created_at,
});

export const mapProductToDB = (prod, userId) => ({
  id: prod.id || uid(),
  user_id: userId,
  name: prod.name,
  type: prod.type || "product",
  category: prod.category || null,
  unit: prod.unit || (prod.type === "service" ? "layanan" : "pcs"),
  description: prod.description || null,
  sku: prod.sku || "",
  cost_price: Number(prod.costPrice) || 0,
  price: Number(prod.price) || 0,
  stock: prod.type === "service" ? 0 : Number(prod.stock) || 0,
  min_stock: prod.type === "service" ? 0 : Number(prod.minStock) || 5,
});

export const inventoryService = {
  async fetchProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw error;
    return (data || []).map(mapProductFromDB);
  },

  async createProduct(product, userId) {
    const row = mapProductToDB(product, userId);
    const { data, error } = await supabase
      .from("products")
      .insert(row)
      .select()
      .single();

    if (error) throw error;
    return mapProductFromDB(data);
  },

  async updateProduct(id, updates) {
    const payload = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.type !== undefined) payload.type = updates.type;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.unit !== undefined) payload.unit = updates.unit;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.sku !== undefined) payload.sku = updates.sku;
    if (updates.costPrice !== undefined) payload.cost_price = Number(updates.costPrice);
    if (updates.price !== undefined) payload.price = Number(updates.price);
    if (updates.stock !== undefined) payload.stock = Number(updates.stock);
    if (updates.minStock !== undefined) payload.min_stock = Number(updates.minStock);

    const { data, error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return mapProductFromDB(data);
  },

  async adjustStock(id, newStock) {
    const { data, error } = await supabase
      .from("products")
      .update({ stock: Number(newStock) || 0 })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return mapProductFromDB(data);
  },

  async deleteProduct(id) {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;
    return true;
  },
};
