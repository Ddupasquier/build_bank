import { chromium } from "playwright";
import {
  MaterialVendorLink,
  Vendor,
  VendorConfig
} from "../db";
import {
  parsePrice,
  extractPriceFromJsonLd,
  extractPriceFromMeta,
  extractPriceByRegex,
  extractPriceFromHtml,
  extractPriceFromPriceNodes
} from "./helpers";
import { VendorScraper } from "./types";

function parseList(input?: string | null) {
  if (!input) return [];
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function applyLocationConfig(page: import("playwright").Page, config: VendorConfig, zip: string) {
  const triggers = parseList(config.location_triggers);
  const zipInputs = parseList(config.zip_inputs);
  const storeButtons = parseList(config.store_result_selectors);
  try {
    if (triggers.length) {
      for (const t of triggers) {
        try {
          await page.waitForSelector(t, { timeout: 8000 });
          await page.click(t);
          break;
        } catch {
          continue;
        }
      }
    }
    if (zipInputs.length) {
      for (const z of zipInputs) {
        try {
          await page.waitForSelector(z, { timeout: 8000 });
          await page.fill(z, zip);
          await page.keyboard.press("Enter");
          break;
        } catch {
          continue;
        }
      }
    }
    if (storeButtons.length) {
      for (const b of storeButtons) {
        try {
          await page.waitForSelector(b, { timeout: 8000 });
          const handle = await page.$(b);
          if (handle) {
            await handle.click();
            break;
          }
        } catch {
          continue;
        }
      }
    }
  } catch {
    // swallow
  }
}

export const configDrivenScraper: VendorScraper = {
  vendorName: "ConfigDriven",
  canHandle: () => true,
  async fetchPrice(link: MaterialVendorLink, vendor: Vendor, zip: string, config?: VendorConfig | null) {
    if (!config) throw new Error("No vendor config provided");
    if (!link.product_url) throw new Error("Missing product_url for link");
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
    });
    try {
      if (config.location_triggers || config.zip_inputs || config.store_result_selectors) {
        const baseUrl = vendor.base_url || new URL(link.product_url).origin;
        await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
        await applyLocationConfig(page, config, zip);
      }

      await page.goto(link.product_url, { waitUntil: "networkidle", timeout: 45000 });

      const jsonPrice = await extractPriceFromJsonLd(page);
      if (jsonPrice !== null) return { price: jsonPrice, unit: link.sku };
      const metaPrice = await extractPriceFromMeta(page);
      if (metaPrice !== null) return { price: metaPrice, unit: link.sku };

      const selectors = parseList(config.price_selectors);
      let priceText: string | null = null;
      await page.waitForTimeout(1500);
      for (const sel of selectors) {
        try {
          await page.waitForSelector(sel, { timeout: 8000 });
          priceText = await page.textContent(sel);
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
        throw new Error(
          selectors.length ? `Price not found; tried selectors: ${selectors.join(", ")}` : "Price not found"
        );
      }
      const price = parsePrice(priceText);
      return { price, unit: link.sku };
    } finally {
      if (!page.isClosed()) await page.close();
      await browser.close();
    }
  }
};
