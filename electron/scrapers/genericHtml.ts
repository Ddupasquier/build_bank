import { chromium } from "playwright";
import { MaterialVendorLink, Vendor } from "../db";
import { parsePrice, extractPriceFromJsonLd, extractPriceByRegex } from "./helpers";
import { VendorScraper } from "./types";

// Simple scraper that expects a price selector in link.notes or a standard selector fallback.
export const genericHtmlScraper: VendorScraper = {
  vendorName: "Generic HTML",
  canHandle: () => true,
  async fetchPrice(link: MaterialVendorLink, _vendor: Vendor) {
    if (!link.product_url) throw new Error("Missing product_url for link");
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
      await page.goto(link.product_url, { waitUntil: "domcontentloaded", timeout: 30000 });

      const jsonPrice = await extractPriceFromJsonLd(page);
      if (jsonPrice !== null) return { price: jsonPrice, unit: link.sku };

      const candidates = [
        link.notes?.trim(),
        "[data-automation-id='price']",
        "[data-automation-id='pricingPrice']",
        ".price",
        ".price__dollars",
        ".price__wrapper",
        ".price-info__price"
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

      if (!priceText) {
        const regexPrice = await extractPriceByRegex(page);
        if (regexPrice !== null) return { price: regexPrice, unit: link.sku };
        throw new Error(`No price text found with selectors: ${candidates.join(", ")}`);
      }
      const price = parsePrice(priceText);
      return { price, unit: link.sku };
    } finally {
      if (!page.isClosed()) await page.close();
      await browser.close();
    }
  }
};
