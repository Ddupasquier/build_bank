export function parsePrice(text: string): number {
  const normalized = text.replace(/[\s,]/g, "");
  const match = normalized.match(/(\d+(\.\d+)?)/);
  if (!match) throw new Error(`Unable to parse price from "${text}"`);
  return parseFloat(match[1]);
}

// Attempt to pull price from JSON-LD offers on the page.
export async function extractPriceFromJsonLd(page: import("playwright").Page): Promise<number | null> {
  try {
    const prices = await page.$$eval('script[type="application/ld+json"]', (nodes) => {
      const results: number[] = [];
      for (const node of nodes) {
        try {
          const json = JSON.parse(node.textContent || "{}");
          const offers = Array.isArray(json.offers) ? json.offers : json.offers ? [json.offers] : [];
          for (const offer of offers) {
            const priceVal = offer.price || offer.priceSpecification?.price;
            if (priceVal) {
              const num = Number(priceVal);
              if (!isNaN(num)) results.push(num);
            }
          }
        } catch {
          continue;
        }
      }
      return results;
    });
    if (prices.length > 0) return prices[0];
  } catch {
    return null;
  }
  return null;
}

// Regex scan of visible text to find a price-looking string.
export async function extractPriceByRegex(page: import("playwright").Page): Promise<number | null> {
  try {
    const text = await page.innerText("body");
    const match = text.match(/\$\s?(\d{1,4}(?:[.,]\d{2})?)/) || text.match(/(\d{1,4}[.,]\d{2})/);
    if (match) {
      const cleaned = match[1].replace(",", "");
      const num = Number(cleaned);
      if (!isNaN(num)) return num;
    }
  } catch {
    return null;
  }
  return null;
}

export function extractPriceFromHtml(html: string): number | null {
  const patterns = [
    /"price"\s*:\s*"(\d+(?:\.\d+)?)/i,
    /"price"\s*:\s*(\d+(?:\.\d+)?)/i,
    /"itemPrice"\s*:\s*"(\d+(?:\.\d+)?)/i,
    /"unitPrice"\s*:\s*"(\d+(?:\.\d+)?)/i,
    /"salePrice"\s*:\s*"(\d+(?:\.\d+)?)/i,
    /"salePrice"\s*:\s*(\d+(?:\.\d+)?)/i,
    /"priceAmount"\s*:\s*"(\d+(?:\.\d+)?)/i
  ];
  for (const pat of patterns) {
    const m = html.match(pat);
    if (m && m[1]) {
      const num = Number(m[1]);
      if (!isNaN(num)) return num;
    }
  }
  return null;
}

export async function extractPriceFromMeta(page: import("playwright").Page): Promise<number | null> {
  const selectors = [
    'meta[itemprop="price"]',
    '[itemprop="price"]',
    'meta[property="product:price:amount"]',
    '[data-price]'
  ];
  try {
    for (const sel of selectors) {
      const val = await page.$eval(
        sel,
        (el: any) => el.getAttribute?.("content") || el.textContent || el.getAttribute?.("data-price")
      );
      if (val) {
        const num = parseFloat(String(val).replace(/[^0-9.]/g, ""));
        if (!isNaN(num)) return num;
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

export async function extractPriceFromPriceNodes(page: import("playwright").Page): Promise<number | null> {
  try {
    const texts = await page.$$eval(
      '[class*="price"], [id*="price"], [data-testid*="price"], [data-automation-id*="price"]',
      (nodes) =>
        nodes.map((n) => ({
          text: n.textContent || "",
          dollars: n.querySelector?.('[class*="dollar"], [class*="dollars"]')?.textContent || "",
          cents: n.querySelector?.('[class*="cent"], [class*="cents"]')?.textContent || ""
        }))
    );
    const candidates: number[] = [];
    for (const entry of texts) {
      const parts: string[] = [];
      if (entry.dollars) parts.push(entry.dollars.trim());
      if (entry.cents) parts.push(entry.cents.trim());
      const combined = parts.length ? parts.join(".") : (entry.text || "").replace(/\s+/g, " ").trim();
      const text = combined;
      if (!text) continue;
      const decMatch = text.match(/(\d+[.,]\d{2})/);
      if (decMatch) {
        const num = Number(decMatch[1].replace(",", "."));
        if (!isNaN(num)) candidates.push(num);
      }
      const dollarMatch = text.match(/\$\s?(\d+(?:[.,]\d{2})?)/);
      if (dollarMatch) {
        const num = Number(dollarMatch[1].replace(",", "."));
        if (!isNaN(num)) candidates.push(num);
      }
      const nums = text.match(/\d+/g);
      if (nums && nums.length >= 2 && nums[1].length <= 2) {
        const price = Number(`${nums[0]}.${nums[1].padStart(2, "0")}`);
        if (!isNaN(price)) candidates.push(price);
      }
      if (nums && nums.length >= 1) {
        const price = Number(nums[0]);
        if (!isNaN(price)) candidates.push(price);
      }
    }
    if (candidates.length > 0) {
      return Math.min(...candidates);
    }
  } catch {
    return null;
  }
  return null;
}
