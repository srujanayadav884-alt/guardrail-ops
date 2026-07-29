import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../Sidebar";
import Navbar from "../Navbar";

const links = [
  { to: "/admin", label: "Security Analytics" },
  { to: "/admin/security-events", label: "Security Events" },
  { to: "/admin/audit-logs", label: "Audit Logs" },
  { to: "/admin/blocked-requests", label: "Blocked Requests" },
  { to: "/admin/policies", label: "Policy Management" },
  { to: "/admin/users", label: "User Monitoring" },
];

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen">
      <Sidebar title="Admin Console" links={links} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
