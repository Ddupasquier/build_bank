import { Outlet, useLocation, Link } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { ipcClient } from "./api/ipcClient";

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
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusErrors, setStatusErrors] = useState<string[]>([]);

  useEffect(() => {
    ipcClient
      .getLastPriceUpdate()
      .then((val) => setLastUpdated(val))
      .catch((err) => console.error("Failed to load last update", err));
    const interval = setInterval(() => {
      ipcClient
        .getLastPriceUpdate()
        .then((val) => setLastUpdated(val))
        .catch((err) => console.error("Failed to refresh last update", err));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdatePrices = async () => {
    setUpdating(true);
    setStatusMessage(null);
    setStatusErrors([]);
    try {
      const res = await ipcClient.updateAllPrices();
      setLastUpdated(res.updatedAt);
      if (res.failed && res.failed > 0) {
        setStatusMessage(`Updated ${res.count} links with ${res.failed} errors.`);
        const errs =
          res.errors?.map(
            (e) =>
              `${e.vendorName || `Vendor ${e.vendorId}`} · ${e.materialName || `Material ${e.materialId}`}: ${
                e.message
              }${e.url ? ` (${e.url})` : ""}`
          ) ?? [];
        setStatusErrors(errs);
        console.error("Price update errors", res.errors);
      } else {
        setStatusMessage(`Updated ${res.count} links successfully.`);
      }
    } catch (err) {
      console.error("Price update failed", err);
      setStatusMessage("Price update failed. Check logs for details.");
    } finally {
      setUpdating(false);
    }
  };

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
          <div className="flex gap-3 items-center">
            <button
              onClick={handleUpdatePrices}
              className="bg-brand-600 hover:bg-brand-700 text-sm px-4 py-2 rounded text-white disabled:opacity-60"
              disabled={updating}
            >
              {updating ? "Updating..." : "Update prices now"}
            </button>
            <div className="text-xs text-slate-400">
              Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : "—"}
            </div>
          </div>
        </header>
        <div className="p-6">
          {statusMessage ? (
            <div className="mb-3 text-xs text-slate-200 bg-slate-800 border border-slate-700 rounded px-3 py-2 space-y-1">
              <div>{statusMessage}</div>
              {statusErrors.length > 0 ? (
                <ul className="list-disc list-inside text-amber-300 space-y-1">
                  {statusErrors.map((e, idx) => (
                    <li key={idx}>{e}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
          <Outlet />
        </div>
      </main>
    </div>
  );
}
