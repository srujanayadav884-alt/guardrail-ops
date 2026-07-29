import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../Sidebar";
import Navbar from "../Navbar";

const links = [
  { to: "/", label: "Profile" },
  { to: "/accounts", label: "Account Details" },
  { to: "/assistant", label: "Banking Assistant" },
  { to: "/transactions", label: "Transaction History" },
  { to: "/notifications", label: "Notifications" },
];

export default function UserLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen">
      <Sidebar title="GuardBank" links={links} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
