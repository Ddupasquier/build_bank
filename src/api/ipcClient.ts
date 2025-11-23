import {
  Material,
  MaterialVendorLink,
  Vendor,
  PriceRecord,
  UpdatePricesResult,
  LastUpdateResponse
} from "../types";

async function invoke<T>(channel: string, ...args: unknown[]): Promise<T> {
  if (!window.electronAPI) throw new Error("electronAPI not available");
  return (await window.electronAPI.invoke(channel, ...args)) as T;
}

export const ipcClient = {
  listMaterials: () => invoke<Material[]>("materials:list"),
  createMaterial: (data: Material) => invoke<Material>("materials:create", data),
  updateMaterial: (id: number, data: Partial<Material>) =>
    invoke<Material>("materials:update", id, data),
  deleteMaterial: (id: number) => invoke<{ success: boolean }>("materials:delete", id),
  getMaterialPrices: (materialId: number) =>
    invoke<PriceRecord[]>("materials:latestPrices", materialId),
  getMaterialHistory: (materialId: number, vendorId: number, days: number) =>
    invoke<PriceRecord[]>("materials:history", materialId, vendorId, days),
  listMaterialLinks: (materialId: number) =>
    invoke<MaterialVendorLink[]>("materials:links:list", materialId),
  createMaterialLink: (data: MaterialVendorLink) =>
    invoke<MaterialVendorLink>("materials:links:create", data),
  deleteMaterialLink: (id: number) => invoke<{ success: boolean }>("materials:links:delete", id),
  listVendors: () => invoke<Vendor[]>("vendors:list"),
  createVendor: (data: Vendor) => invoke<Vendor>("vendors:create", data),
  updateVendor: (id: number, data: Partial<Vendor>) => invoke<Vendor>("vendors:update", id, data),
  deleteVendor: (id: number) => invoke<{ success: boolean }>("vendors:delete", id),
  updateAllPrices: () => invoke<UpdatePricesResult>("scraping:updateAllPrices"),
  getLastPriceUpdate: () => invoke<LastUpdateResponse>("settings:lastPriceUpdate")
};
