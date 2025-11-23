import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ipcClient } from "../api/ipcClient";
import { Material, MaterialVendorLink, PriceRecord, Vendor } from "../types";

const materialCategories = ["lumber", "drywall", "fasteners", "plywood", "concrete", "other"];
const units = ["piece", "sheet", "lf", "bf", "box"];

export default function MaterialsPage() {
  const queryClient = useQueryClient();
  const materialsQuery = useQuery({
    queryKey: ["materials"],
    queryFn: ipcClient.listMaterials
  });
  const vendorsQuery = useQuery({
    queryKey: ["vendors"],
    queryFn: ipcClient.listVendors
  });
  const createMutation = useMutation({
    mutationFn: ipcClient.createMaterial,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["materials"] })
  });
  const deleteMutation = useMutation({
    mutationFn: ipcClient.deleteMaterial,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["materials"] })
  });

  const [form, setForm] = useState<Material>({
    name: "",
    category: "",
    unit: "",
    description: ""
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    createMutation.mutate(form);
    setForm({ name: "", category: "", unit: "", description: "" });
  };

  const sorted = useMemo(() => materialsQuery.data ?? [], [materialsQuery.data]);

  return (
    <div className="space-y-6">
      <section className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-lg font-semibold text-slate-100">Materials</div>
            <p className="text-sm text-slate-300">Manage your catalog and vendor mappings.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {sorted.map((mat) => (
            <MaterialCard
              key={mat.id}
              material={mat}
              vendors={vendorsQuery.data ?? []}
              onDelete={() => mat.id && deleteMutation.mutate(mat.id)}
            />
          ))}
        </div>
      </section>

      <section className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
        <div className="text-lg font-semibold mb-2">Add material</div>
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            className="bg-slate-900 border border-slate-700 rounded px-3 py-2"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <select
            className="bg-slate-900 border border-slate-700 rounded px-3 py-2"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="">Category</option>
            {materialCategories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            className="bg-slate-900 border border-slate-700 rounded px-3 py-2"
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
          >
            <option value="">Unit</option>
            {units.map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
          <input
            className="bg-slate-900 border border-slate-700 rounded px-3 py-2"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded"
              disabled={createMutation.isPending}
            >
              Save material
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function MaterialCard({
  material,
  vendors,
  onDelete
}: {
  material: Material;
  vendors: Vendor[];
  onDelete: () => void;
}) {
  const queryClient = useQueryClient();
  const linksQuery = useQuery({
    queryKey: ["material-links", material.id],
    queryFn: () => ipcClient.listMaterialLinks(material.id!)
  });
  const pricesQuery = useQuery({
    queryKey: ["material-prices", material.id],
    queryFn: () => ipcClient.getMaterialPrices(material.id!)
  });
  const createLink = useMutation({
    mutationFn: ipcClient.createMaterialLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["material-links", material.id] });
    }
  });
  const deleteLink = useMutation({
    mutationFn: ipcClient.deleteMaterialLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["material-links", material.id] });
    }
  });

  const [linkForm, setLinkForm] = useState<Partial<MaterialVendorLink>>({
    vendor_id: vendors[0]?.id,
    sku: "",
    product_url: "",
    notes: ""
  });

  const byVendor = useMemo(() => {
    const map = new Map<number, PriceRecord>();
    (pricesQuery.data || []).forEach((p) => map.set(p.vendor_id, p));
    return map;
  }, [pricesQuery.data]);

  const cheapest = useMemo(() => {
    const entries = Array.from(byVendor.values());
    if (!entries.length) return null;
    return entries.reduce((prev, curr) => (prev.price < curr.price ? prev : curr));
  }, [byVendor]);

  const [selectedVendorId, setSelectedVendorId] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!selectedVendorId && linksQuery.data?.length) {
      setSelectedVendorId(linksQuery.data[0].vendor_id);
    }
  }, [linksQuery.data, selectedVendorId]);

  const historyQuery = useQuery({
    queryKey: ["material-history", material.id, selectedVendorId],
    enabled: Boolean(selectedVendorId && material.id),
    queryFn: () => ipcClient.getMaterialHistory(material.id!, selectedVendorId!, 30)
  });

  const onSubmitLink = (e: FormEvent) => {
    e.preventDefault();
    if (!linkForm.vendor_id || !material.id) return;
    createLink.mutate({
      material_id: material.id,
      vendor_id: linkForm.vendor_id,
      sku: linkForm.sku || "",
      product_url: linkForm.product_url || "",
      notes: linkForm.notes || ""
    });
    setLinkForm((prev) => ({ ...prev, sku: "", product_url: "", notes: "" }));
  };

  return (
    <div className="border border-slate-700 rounded-lg p-4 bg-slate-900/60 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold">{material.name}</div>
          <div className="text-xs text-slate-400">
            {material.category || "Uncategorized"} · {material.unit || "unit"}
          </div>
          {material.description ? (
            <p className="text-sm text-slate-300 mt-2 overflow-hidden text-ellipsis">
              {material.description}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {cheapest ? (
            <div className="bg-emerald-700/30 border border-emerald-600 text-emerald-100 text-xs px-2 py-1 rounded">
              Best: {vendors.find((v) => v.id === cheapest.vendor_id)?.name || "Vendor"} $
              {cheapest.price.toFixed(2)}
            </div>
          ) : null}
          <button onClick={onDelete} className="text-xs text-red-400 hover:text-red-200">
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="border border-slate-700 rounded-lg p-3">
          <div className="text-sm font-semibold mb-2">Vendor links</div>
          <div className="space-y-2">
            {(linksQuery.data || []).map((link) => {
              const vendor = vendors.find((v) => v.id === link.vendor_id);
              return (
                <div
                  key={link.id}
                  className="flex items-center justify-between text-sm bg-slate-800/60 rounded px-2 py-1"
                >
                  <div>
                    <div className="font-semibold">{vendor?.name || "Vendor"}</div>
                    <div className="text-xs text-slate-400">
                      {link.sku || link.product_url || "No SKU/URL"}
                    </div>
                  </div>
                  <button
                    onClick={() => link.id && deleteLink.mutate(link.id)}
                    className="text-xs text-red-400 hover:text-red-200"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
            {linksQuery.data?.length === 0 ? (
              <div className="text-xs text-slate-400">No links yet.</div>
            ) : null}
          </div>
          <form onSubmit={onSubmitLink} className="mt-3 space-y-2">
            <select
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm"
              value={linkForm.vendor_id ?? ""}
              onChange={(e) => setLinkForm({ ...linkForm, vendor_id: Number(e.target.value) })}
            >
              <option value="">Select vendor</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
            <input
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm"
              placeholder="SKU"
              value={linkForm.sku ?? ""}
              onChange={(e) => setLinkForm({ ...linkForm, sku: e.target.value })}
            />
            <input
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm"
              placeholder="Product URL"
              value={linkForm.product_url ?? ""}
              onChange={(e) => setLinkForm({ ...linkForm, product_url: e.target.value })}
            />
            <input
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm"
              placeholder="Notes (optional)"
              value={linkForm.notes ?? ""}
              onChange={(e) => setLinkForm({ ...linkForm, notes: e.target.value })}
            />
            <button
              type="submit"
              className="w-full bg-brand-600 hover:bg-brand-700 text-white text-sm px-3 py-2 rounded disabled:opacity-60"
              disabled={createLink.isPending}
            >
              Add link
            </button>
          </form>
        </div>

        <div className="border border-slate-700 rounded-lg p-3">
          <div className="text-sm font-semibold mb-2">Latest prices</div>
          <div className="space-y-2">
            {vendors.map((v) => {
              const price = v.id ? byVendor.get(v.id) : undefined;
              if (!price) return null;
              return (
                <div
                  key={v.id}
                  className="flex items-center justify-between bg-slate-800/60 rounded px-2 py-1 text-sm"
                >
                  <div>
                    <div className="font-semibold">{v.name}</div>
                    <div className="text-xs text-slate-400">
                      {new Date(price.fetched_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right text-base font-semibold">${price.price.toFixed(2)}</div>
                </div>
              );
            })}
            {byVendor.size === 0 ? (
              <div className="text-xs text-slate-400">
                Run “Update prices now” after adding vendor links to populate.
              </div>
            ) : null}
          </div>
        </div>

        <div className="border border-slate-700 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold">Price history (30d)</div>
            <select
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs"
              value={selectedVendorId ?? ""}
              onChange={(e) => setSelectedVendorId(Number(e.target.value))}
            >
              {(linksQuery.data || []).map((link) => (
                <option key={link.id} value={link.vendor_id}>
                  {vendors.find((v) => v.id === link.vendor_id)?.name || "Vendor"}
                </option>
              ))}
            </select>
          </div>
          {historyQuery.data && historyQuery.data.length > 1 ? (
            <Sparkline data={historyQuery.data} />
          ) : (
            <div className="text-xs text-slate-400">Not enough data yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Sparkline({ data }: { data: PriceRecord[] }) {
  const width = 240;
  const height = 80;
  const prices = data.map((d) => d.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const points = data
    .map((d, idx) => {
      const x = (idx / Math.max(data.length - 1, 1)) * (width - 20) + 10;
      const y = height - ((d.price - min) / range) * (height - 20) - 10;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="w-full">
      <svg width={width} height={height}>
        <polyline
          fill="none"
          stroke="#22c55e"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={points}
        />
      </svg>
      <div className="text-xs text-slate-400">
        Min ${min.toFixed(2)} · Max ${max.toFixed(2)}
      </div>
    </div>
  );
}
