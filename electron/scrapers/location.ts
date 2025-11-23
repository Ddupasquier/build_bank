import { Page } from "playwright";
import log from "electron-log";

async function waitSafe(page: Page, selector: string, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch {
    return false;
  }
}

async function clickFirst(page: Page, selectors: string[], timeout = 5000) {
  for (const sel of selectors) {
    try {
      await page.waitForSelector(sel, { timeout });
      const handle = await page.$(sel);
      if (handle) {
        await handle.click();
        return true;
      }
    } catch {
      continue;
    }
  }
  return false;
}

export async function setZipGeneric(page: Page, zip: string, origin?: string) {
  try {
    if (origin) {
      await page.goto(origin, { waitUntil: "domcontentloaded", timeout: 20000 });
    }
    const triggers = [
      '[data-automation-id*="store"]',
      '[data-testid*="store"]',
      '[aria-label*="store"]',
      '[aria-label*="location"]',
      "button:has-text('Store')",
      "button:has-text('Location')",
      "button:has-text('Pickup')",
      "a:has-text('Store')"
    ];
    await clickFirst(page, triggers, 3000);

    const zipInputs = [
      'input[name*="zip"]',
      'input[placeholder*="Zip"]',
      'input[aria-label*="Zip"]',
      'input[type="search"]',
      'input[type="text"]'
    ];
    for (const sel of zipInputs) {
      if (await waitSafe(page, sel, 3000)) {
        await page.fill(sel, zip);
        await page.keyboard.press("Enter");
        break;
      }
    }

    const storeButtons = [
      'button:has-text("Select")',
      '[data-automation-id*="store"] button',
      '[data-testid*="store"] button'
    ];
    await clickFirst(page, storeButtons, 5000);
    await page.waitForTimeout(2000);
  } catch (e) {
    log.warn(`[scrape] setZipGeneric failed: ${e}`);
  }
}
