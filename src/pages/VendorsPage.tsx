import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ipcClient } from "../api/ipcClient";
import { Vendor } from "../types";

export default function VendorsPage() {
  const queryClient = useQueryClient();
  const vendorsQuery = useQuery({
    queryKey: ["vendors"],
    queryFn: ipcClient.listVendors
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
    </div>
  );
}
