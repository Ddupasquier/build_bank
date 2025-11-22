import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ipcClient } from "../api/ipcClient";
import { Material } from "../types";

const materialCategories = ["lumber", "drywall", "fasteners", "plywood", "concrete", "other"];
const units = ["piece", "sheet", "lf", "bf", "box"];

export default function MaterialsPage() {
  const queryClient = useQueryClient();
  const materialsQuery = useQuery(["materials"], ipcClient.listMaterials);
  const createMutation = useMutation(ipcClient.createMaterial, {
    onSuccess: () => queryClient.invalidateQueries(["materials"])
  });
  const deleteMutation = useMutation(ipcClient.deleteMaterial, {
    onSuccess: () => queryClient.invalidateQueries(["materials"])
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sorted.map((mat) => (
            <div key={mat.id} className="border border-slate-700 rounded-lg p-3 bg-slate-900/60">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{mat.name}</div>
                  <div className="text-xs text-slate-400">
                    {mat.category || "Uncategorized"} · {mat.unit || "unit"}
                  </div>
                </div>
                <button
                  onClick={() => mat.id && deleteMutation.mutate(mat.id)}
                  className="text-xs text-red-400 hover:text-red-200"
                >
                  Delete
                </button>
              </div>
              {mat.description ? (
                <p className="text-sm text-slate-300 mt-2 overflow-hidden text-ellipsis">
                  {mat.description}
                </p>
              ) : null}
            </div>
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
              disabled={createMutation.isLoading}
            >
              Save material
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
