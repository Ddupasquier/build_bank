import { chromium } from "playwright";
import { MaterialVendorLink, Vendor } from "../db";
import { parsePrice, extractPriceFromJsonLd } from "./helpers";
import { VendorScraper } from "./types";

export const homeDepotScraper: VendorScraper = {
  vendorName: "Home Depot",
  canHandle(vendor: Vendor) {
    return /home\s*depot/i.test(vendor.name) || /homedepot\.com/i.test(vendor.base_url || "");
  },
  async fetchPrice(link: MaterialVendorLink, _vendor: Vendor) {
    if (!link.product_url) throw new Error("Missing product_url for link");
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
      await page.goto(link.product_url, { waitUntil: "domcontentloaded", timeout: 30000 });

      const jsonPrice = await extractPriceFromJsonLd(page);
      if (jsonPrice !== null) return { price: jsonPrice };

      const candidates = [
        link.notes?.trim(),
        '[data-automation-id="price"]',
        ".price__dollars",
        ".price__wrapper",
        ".price-format__large"
      ].filter(Boolean) as string[];
      let priceText: string | null = null;
      for (const selector of candidates) {
        try {
          await page.waitForSelector(selector, { timeout: 8000 });
          priceText = await page.textContent(selector);
          if (priceText) break;
        } catch {
          continue;
        }
      }
      if (!priceText) throw new Error(`Price not found; tried selectors: ${candidates.join(", ")}`);
      const price = parsePrice(priceText);
      return { price };
    } finally {
      await browser.close();
    }
  }
};
