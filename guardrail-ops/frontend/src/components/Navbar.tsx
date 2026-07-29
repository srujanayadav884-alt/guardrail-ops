import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          aria-label="Open menu"
          className="rounded-md p-2 text-guard-slate hover:bg-slate-100 md:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
          </svg>
        </button>
        <div>
          <p className="text-xs text-slate-500 sm:text-sm">Welcome back,</p>
          <p className="text-sm font-semibold text-guard-navy sm:text-base">{user?.fullName}</p>
        </div>
      </div>
      <button
        onClick={() => {
          logout();
          navigate("/login");
        }}
        className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-guard-slate hover:bg-slate-50 sm:px-4 sm:text-sm"
      >
        Sign out
      </button>
    </header>
  );
}
