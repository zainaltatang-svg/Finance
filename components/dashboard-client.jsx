"use client";

import dynamic from "next/dynamic";

const BusinessDashboard = dynamic(
  () => import("../JSX/strimnet-manajemen-bisnis.jsx"),
  {
    ssr: false,
    loading: () => <div className="dashboard-loading">Menyiapkan workspace ZENTA...</div>,
  }
);

export default function DashboardClient() {
  return <BusinessDashboard />;
}
