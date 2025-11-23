import { chromium } from "playwright";
import { MaterialVendorLink, Vendor } from "../db";
import {
  parsePrice,
  extractPriceFromJsonLd,
  extractPriceFromMeta,
  extractPriceFromPriceNodes,
  extractPriceByRegex,
  extractPriceFromHtml
} from "./helpers";
import { setZipGeneric } from "./location";
import { VendorScraper } from "./types";

export const universalScraper: VendorScraper = {
  vendorName: "Universal",
  canHandle: () => true,
  async fetchPrice(link: MaterialVendorLink, vendor: Vendor, zip: string) {
    if (!link.product_url) throw new Error("Missing product_url for link");
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
    });
    try {
      const origin = new URL(link.product_url).origin;
      await setZipGeneric(page, zip, origin);
      await page.goto(link.product_url, { waitUntil: "networkidle", timeout: 45000 });

      const jsonPrice = await extractPriceFromJsonLd(page);
      if (jsonPrice !== null) return { price: jsonPrice, unit: link.sku };
      const metaPrice = await extractPriceFromMeta(page);
      if (metaPrice !== null) return { price: metaPrice, unit: link.sku };
      const nodePrice = await extractPriceFromPriceNodes(page);
      if (nodePrice !== null) return { price: nodePrice, unit: link.sku };

      await page.waitForTimeout(1000);
      const regexPrice = await extractPriceByRegex(page);
      if (regexPrice !== null) return { price: regexPrice, unit: link.sku };
      const html = await page.content();
      const htmlPrice = extractPriceFromHtml(html);
      if (htmlPrice !== null) return { price: htmlPrice, unit: link.sku };

      throw new Error("Price not found using generic heuristics");
    } finally {
      if (!page.isClosed()) await page.close();
      await browser.close();
    }
  }
};
