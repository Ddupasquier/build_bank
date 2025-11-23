import { MaterialVendorLink, Vendor } from "../db";
import { genericHtmlScraper } from "./genericHtml";
import { homeDepotScraper } from "./homeDepot";
import { lowesScraper } from "./lowes";
import { VendorScraper, ScrapeError, ScrapeResult } from "./types";

const scrapers: VendorScraper[] = [homeDepotScraper, lowesScraper, genericHtmlScraper];

export async function fetchPriceForLink(
  link: MaterialVendorLink,
  vendor: Vendor
): Promise<{ price: number; unit?: string }> {
  const scraper = scrapers.find((s) => s.canHandle(vendor));
  if (!scraper) throw new Error(`No scraper for vendor: ${vendor.name}`);
  return scraper.fetchPrice(link, vendor);
}

export function makeScrapeError(vendorId: number, materialId: number, message: string): ScrapeError {
  return { vendorId, materialId, message };
}
