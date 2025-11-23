import { chromium } from "playwright";
import { MaterialVendorLink, Vendor } from "../db";
import {
  parsePrice,
  extractPriceFromJsonLd,
  extractPriceByRegex,
  extractPriceFromHtml,
  extractPriceFromMeta,
  extractPriceFromPriceNodes
} from "./helpers";
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
      await page.goto(link.product_url, { waitUntil: "networkidle", timeout: 45000 });
      await page.waitForTimeout(1200);

      const jsonPrice = await extractPriceFromJsonLd(page);
      if (jsonPrice !== null) return { price: jsonPrice, unit: link.sku };

      const metaPrice = await extractPriceFromMeta(page);
      if (metaPrice !== null) return { price: metaPrice, unit: link.sku };

      const candidates = [
        link.notes?.trim(),
        "[data-automation-id='price']",
        "[data-automation-id='pricingPrice']",
        "[data-testid='main-price']",
        ".price",
        ".price__dollars",
        ".price__wrapper",
        ".price-info__price",
        ".item-price-dollar"
      ].filter(Boolean) as string[];

      // Give the page a moment after selectors
      await page.waitForTimeout(800);

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
        const nodePrice = await extractPriceFromPriceNodes(page);
        if (nodePrice !== null) return { price: nodePrice, unit: link.sku };
        const regexPrice = await extractPriceByRegex(page);
        if (regexPrice !== null) return { price: regexPrice, unit: link.sku };
        const html = await page.content();
        const htmlPrice = extractPriceFromHtml(html);
        if (htmlPrice !== null) return { price: htmlPrice, unit: link.sku };
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
