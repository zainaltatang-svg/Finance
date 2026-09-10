import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase environment variables are missing.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Sinkronisasi sesi otentikasi ke cookie agar dapat diverifikasi oleh Next.js Server Middleware / Proxy
if (typeof window !== "undefined") {
  // Sync immediate session state on load
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.access_token) {
      document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=604800; SameSite=Lax`;
    }
  });

  supabase.auth.onAuthStateChange((event, session) => {
    if (session?.access_token) {
      document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=604800; SameSite=Lax`;
    } else if (event === "SIGNED_OUT" || !session) {
      document.cookie = "sb-access-token=; path=/; max-age=0; SameSite=Lax";
    }
  });
}