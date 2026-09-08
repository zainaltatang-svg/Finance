"use client";

import { useState } from "react";
import { FinanceProvider } from "../../context/FinanceContext";
import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";

export default function DashboardLayout({ children }) {
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
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
  );
}
