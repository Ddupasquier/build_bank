import { MaterialVendorLink, Vendor } from "../db";

export interface VendorScraper {
  vendorName: string;
  canHandle: (vendor: Vendor) => boolean;
  fetchPrice: (link: MaterialVendorLink, vendor: Vendor) => Promise<{ price: number; unit?: string }>;
}

export type ScrapeError = { vendorId: number; materialId: number; message: string };

export type ScrapeResult =
  | { ok: true; materialId: number; vendorId: number; price: number; unit?: string }
  | { ok: false; error: ScrapeError };
