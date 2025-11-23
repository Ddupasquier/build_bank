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
    const match = text.match(/\$?\s?(\d{1,4}(?:[.,]\d{2})?)/);
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
