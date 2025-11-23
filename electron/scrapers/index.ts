import { MaterialVendorLink, Vendor } from "../db";
import { genericHtmlScraper } from "./genericHtml";
import { configDrivenScraper } from "./configDriven";
import { universalScraper } from "./universal";
import { VendorScraper, ScrapeError, ScrapeResult } from "./types";

const scrapers: VendorScraper[] = [universalScraper, genericHtmlScraper];

export async function fetchPriceForLink(
  link: MaterialVendorLink,
  vendor: Vendor,
  zip: string,
  config?: import("../db").VendorConfig | null
): Promise<{ price: number; unit?: string }> {
  if (config) {
    return configDrivenScraper.fetchPrice(link, vendor, zip, config);
  }
  const scraper = scrapers.find((s) => s.canHandle(vendor));
  if (!scraper) throw new Error(`No scraper for vendor: ${vendor.name}`);
  return scraper.fetchPrice(link, vendor, zip, config || undefined);
}

export function makeScrapeError(vendorId: number, materialId: number, message: string): ScrapeError {
  return { vendorId, materialId, message };
}
