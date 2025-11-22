import { Outlet, useLocation, Link } from "react-router-dom";
import { useMemo } from "react";

const navItems = [
  { label: "Dashboard", path: "/" },
  { label: "Materials", path: "/materials" },
  { label: "Vendors", path: "/vendors" },
  { label: "Projects", path: "/projects" },
  { label: "Settings", path: "/settings" }
];

export default function App() {
  const location = useLocation();
  const activePath = useMemo(() => location.pathname, [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-60 bg-slate-950 border-r border-slate-800 p-4 flex flex-col gap-4">
        <div className="text-2xl font-semibold text-brand-500">BuildBank</div>
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = activePath === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`rounded px-3 py-2 transition ${
                  isActive ? "bg-brand-700 text-white" : "hover:bg-slate-800"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto bg-slate-900">
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <div className="text-lg font-semibold text-slate-100">Material Price Intelligence</div>
            <div className="text-xs text-slate-400">Offline-first · Secure IPC</div>
          </div>
          <div className="flex gap-3">
            <button className="bg-brand-600 hover:bg-brand-700 text-sm px-4 py-2 rounded text-white">
              Update prices now
            </button>
            <div className="text-xs text-slate-400">Last updated: —</div>
          </div>
        </header>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
