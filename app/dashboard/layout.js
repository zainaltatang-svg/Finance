"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FinanceProvider } from "../../context/FinanceContext";
import { ToastProvider } from "../../components/ui/Toast";
import { ConfirmProvider } from "../../components/ui/ConfirmModal";
import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";
import { supabase } from "../../lib/supabase";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function verifyAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          if (typeof document !== "undefined") {
            document.cookie = "sb-access-token=; path=/; max-age=0; SameSite=Lax";
          }
          router.replace("/");
          return;
        }
      } catch (err) {
        console.error("Auth guard error:", err);
        router.replace("/");
      }
    }

    verifyAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        if (typeof document !== "undefined") {
          document.cookie = "sb-access-token=; path=/; max-age=0; SameSite=Lax";
        }
        router.replace("/");
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [router]);

  return (
    <ToastProvider>
      <ConfirmProvider>
        <FinanceProvider>
          <div className="dashboard-shell">
            <Sidebar
              isOpen={sidebarOpenMobile}
              isCollapsed={sidebarCollapsed}
              toggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
              closeMobile={() => setSidebarOpenMobile(false)}
            />

            <div className="dashboard-content-area">
              <Topbar openMobile={() => setSidebarOpenMobile(true)} />
              <main className="dashboard-main">{children}</main>
            </div>
          </div>
        </FinanceProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}
