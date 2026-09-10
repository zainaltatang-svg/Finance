import { supabase } from "../supabase";

export const mapProfileFromDB = (row) => ({
  name: row.business_name || "ZENTA Business",
  tagline: row.tagline || "",
  address: row.address || "",
  phone: row.phone || "",
  email: row.email || "",
  currency: row.currency || "IDR",
});

export const profileService = {
  async fetchProfile(userId) {
    if (!userId) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return mapProfileFromDB(data);
  },

  async upsertProfile(profile, userId) {
    if (!userId) throw new Error("User ID diperlukan untuk menyimpan profil.");

    const payload = {
      id: userId,
      business_name: profile.name || "ZENTA Business",
      tagline: profile.tagline || "",
      address: profile.address || "",
      phone: profile.phone || "",
      email: profile.email || "",
      currency: profile.currency || "IDR",
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("profiles")
      .upsert(payload)
      .select()
      .single();

    if (error) throw error;
    return mapProfileFromDB(data);
  },
};
