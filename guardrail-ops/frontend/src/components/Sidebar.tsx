import { NavLink } from "react-router-dom";

export interface SidebarLink {
  to: string;
  label: string;
}

interface SidebarProps {
  title: string;
  links: SidebarLink[];
  mobileOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ title, links, mobileOpen, onClose }: SidebarProps) {
  const content = (
    <>
      <div className="border-b border-white/10 px-6 py-5">
        <p className="text-sm uppercase tracking-widest text-guard-accent">GuardRail-Ops</p>
        <p className="text-lg font-semibold text-white">{title}</p>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end
            onClick={onClose}
            className={({ isActive }) =>
              `block rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-guard-accent/20 text-guard-accent"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-col bg-guard-navy text-slate-200 md:flex">{content}</aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <aside className="relative z-50 flex w-64 flex-col bg-guard-navy text-slate-200">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
