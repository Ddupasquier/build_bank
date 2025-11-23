import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ipcClient } from "../api/ipcClient";
import { Vendor, VendorConfig } from "../types";

export default function VendorsPage() {
  const queryClient = useQueryClient();
  const vendorsQuery = useQuery({
    queryKey: ["vendors"],
    queryFn: ipcClient.listVendors
  });
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const vendorConfigQuery = useQuery({
    queryKey: ["vendor-config", selectedVendor?.id],
    enabled: Boolean(selectedVendor?.id),
    queryFn: () => ipcClient.getVendorConfig(selectedVendor!.id!)
  });

  const [form, setForm] = useState<Vendor>({ name: "", base_url: "", notes: "" });

  const createMutation = useMutation({
    mutationFn: ipcClient.createVendor,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vendors"] })
  });
  const deleteMutation = useMutation({
    mutationFn: ipcClient.deleteVendor,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vendors"] })
  });
  const saveConfigMutation = useMutation({
    mutationFn: ipcClient.saveVendorConfig,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vendor-config", selectedVendor?.id] })
  });

  const [configForm, setConfigForm] = useState<Partial<VendorConfig>>({
    price_selectors: "",
    location_triggers: "",
    zip_inputs: "",
    store_result_selectors: "",
    search_url_template: ""
  });

  useEffect(() => {
    if (vendorConfigQuery.data) {
      setConfigForm(vendorConfigQuery.data);
    } else {
      setConfigForm({
        price_selectors: "",
        location_triggers: "",
        zip_inputs: "",
        store_result_selectors: "",
        search_url_template: ""
      });
    }
  }, [vendorConfigQuery.data, selectedVendor?.id]);

  const onSaveConfig = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedVendor?.id) return;
    saveConfigMutation.mutate({
      vendor_id: selectedVendor.id,
      ...configForm
    });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    createMutation.mutate(form);
    setForm({ name: "", base_url: "", notes: "" });
  };

  return (
    <div className="space-y-6">
      <section className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-lg font-semibold text-slate-100">Vendors</div>
            <p className="text-sm text-slate-300">Track vendors and map SKUs to materials.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vendorsQuery.data?.map((vendor) => (
            <div key={vendor.id} className="border border-slate-700 rounded-lg p-3 bg-slate-900/60">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{vendor.name}</div>
                  <div className="text-xs text-slate-400">{vendor.base_url || "—"}</div>
                </div>
                <button
                  onClick={() => vendor.id && deleteMutation.mutate(vendor.id)}
                  className="text-xs text-red-400 hover:text-red-200"
                >
                  Delete
                </button>
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => setSelectedVendor(vendor)}
                  className="text-xs text-brand-400 hover:text-brand-200 underline"
                >
                  Configure scraping
                </button>
              </div>
              {vendor.notes ? <p className="text-sm text-slate-300 mt-2">{vendor.notes}</p> : null}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
        <div className="text-lg font-semibold mb-2">Add vendor</div>
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            className="bg-slate-900 border border-slate-700 rounded px-3 py-2"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className="bg-slate-900 border border-slate-700 rounded px-3 py-2"
            placeholder="Base URL"
            value={form.base_url}
            onChange={(e) => setForm({ ...form, base_url: e.target.value })}
          />
          <textarea
            className="bg-slate-900 border border-slate-700 rounded px-3 py-2 md:col-span-2"
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded"
              disabled={createMutation.isPending}
            >
              Save vendor
            </button>
          </div>
        </form>
      </section>

      {selectedVendor ? (
        <section className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">Scraping config: {selectedVendor.name}</div>
            <button className="text-xs text-slate-400" onClick={() => setSelectedVendor(null)}>
              Close
            </button>
          </div>
          <form onSubmit={onSaveConfig} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="text-xs text-slate-400">Price selectors (comma-separated)</label>
              <input
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm"
                value={configForm.price_selectors || ""}
                onChange={(e) => setConfigForm({ ...configForm, price_selectors: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Location triggers (open zip dialog)</label>
              <input
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm"
                value={configForm.location_triggers || ""}
                onChange={(e) => setConfigForm({ ...configForm, location_triggers: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">ZIP inputs</label>
              <input
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm"
                value={configForm.zip_inputs || ""}
                onChange={(e) => setConfigForm({ ...configForm, zip_inputs: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Store result selectors</label>
              <input
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm"
                value={configForm.store_result_selectors || ""}
                onChange={(e) =>
                  setConfigForm({ ...configForm, store_result_selectors: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Search URL template (optional)</label>
              <input
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm"
                value={configForm.search_url_template || ""}
                onChange={(e) => setConfigForm({ ...configForm, search_url_template: e.target.value })}
              />
            </div>
            <div className="md:col-span-2 flex gap-2 items-center">
              <button
                type="submit"
                className="bg-brand-600 hover:bg-brand-700 text-white text-sm px-4 py-2 rounded"
              >
                Save config
              </button>
              <div className="text-xs text-slate-400">
                Comma-separated CSS selectors; leave blank to rely on heuristics.
              </div>
            </div>
          </form>
        </section>
      ) : null}
    </div>
  );
}
