import { FormEvent, useEffect, useState } from "react";
import { ipcClient } from "../api/ipcClient";

export default function SettingsPage() {
  const [zip, setZip] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    ipcClient
      .getSetting("location_zip")
      .then((val) => {
        if (val) setZip(val);
      })
      .catch((err) => console.error("Failed to load settings", err));
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await ipcClient.setSetting("location_zip", zip.trim());
      setStatus("Saved ZIP for scraping.");
    } catch (err) {
      console.error(err);
      setStatus("Failed to save ZIP.");
    }
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 space-y-4">
      <div className="text-lg font-semibold">Settings</div>
      <form onSubmit={onSubmit} className="space-y-2">
        <label className="text-sm text-slate-300 block">Default ZIP / store location</label>
        <input
          className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm"
          placeholder="ZIP code (e.g., 97229)"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
        />
        <div className="flex gap-2 items-center">
          <button
            type="submit"
            className="bg-brand-600 hover:bg-brand-700 text-white text-sm px-4 py-2 rounded"
          >
            Save
          </button>
          {status ? <span className="text-xs text-slate-300">{status}</span> : null}
        </div>
      </form>
      <p className="text-xs text-slate-400">
        Used by scrapers to pick a store/region before loading product pages.
      </p>
    </div>
  );
}
