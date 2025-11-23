import { ipcMain } from "electron";
import {
  MaterialsRepository,
  LinksRepository,
  VendorsRepository,
  PricesRepository,
  SettingsRepository
} from "../db";
import { fetchPriceForLink, makeScrapeError } from "../scrapers";
import log from "electron-log";

function randomPrice(base: number) {
  const variance = base * 0.1;
  const min = base - variance;
  const max = base + variance;
  return Number((Math.random() * (max - min) + min).toFixed(2));
}

export function registerScrapingIpc() {
  ipcMain.handle("scraping:updateAllPrices", async () => {
    const materials = MaterialsRepository.list();
    const vendors = VendorsRepository.list();
    const links = materials.flatMap((m) =>
      LinksRepository.listForMaterial(m.id || 0).map((link) => ({ link, material: m }))
    );

    const now = new Date().toISOString();
    let success = 0;
    const errors: {
      vendorId: number;
      materialId: number;
      vendorName: string;
      materialName: string;
      message: string;
      url?: string;
    }[] = [];

    for (const { link, material } of links) {
      const vendor = vendors.find((v) => v.id === link.vendor_id);
      if (!vendor || !material.id) continue;
      try {
        const result = await fetchPriceForLink(link, vendor);
        PricesRepository.insert({
          material_id: material.id,
          vendor_id: vendor.id!,
          price: result.price,
          currency: "USD",
          unit: result.unit ?? material.unit,
          fetched_at: now
        });
        success += 1;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const errorObj = {
          ...makeScrapeError(vendor.id!, material.id, message),
          vendorName: vendor.name,
          materialName: material.name,
          url: link.product_url
        };
        errors.push(errorObj);
        log.error(
          `[scrape] vendor=${vendor.name} material=${material.name} error=${message} url=${link.product_url}`
        );
      }
    }

    SettingsRepository.setLastPriceUpdate(now);

    log.info(`[scrape] completed success=${success} failed=${errors.length}`);

    return { success: true, updatedAt: now, count: success, failed: errors.length, errors };
  });
}
