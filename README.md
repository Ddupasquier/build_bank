# BuildBank (Work-in-Progress / Experimental)

## Status
This iteration did not meet the intended goal of a fully automatic, vendor-agnostic price scraper. Scraping arbitrary retail sites without per-site logic proved unreliable due to location gating, dynamic rendering, and anti-bot measures.

## Intended Functionality
- Cross-platform desktop app (Electron + React + TypeScript) for construction contractors.
- Offline-first: store all data locally in SQLite.
- Track materials, vendors, and vendor links (SKU/URL).
- Periodically update prices via headless scraping:
  - Fetch product pages from provided URLs.
  - Handle store/ZIP selection where required.
  - Extract current price and store history.
- Projects and quotes:
  - Build project material lists, waste factors, vendor preferences.
  - Calculate totals and compare vendors.
  - Export quotes (PDF/CSV/JSON).
- Alerts:
  - Threshold or change-based price alerts after updates.
- UI:
  - Dashboard with KPIs and price trends.
  - Materials/Vendors management.
  - Projects with materials and quotes.
  - Settings for ZIP/location, update schedule.
- Packaging with electron-builder for macOS/Windows.

## What Worked
- Electron + React + TypeScript scaffold with Tailwind UI.
- SQLite schema and IPC CRUD for materials, vendors, links, settings, prices.
- Manual vendor link creation and basic price history UI.
- Configurable ZIP/region and scraping orchestration via IPC.

## What Didn’t
- Truly automatic price scraping for arbitrary vendors without per-site knowledge.
- Dynamic, location-gated, and anti-bot pages (e.g., major retailers) resisted generic selectors/heuristics.
- User-friendly “paste any URL and get a price” was not reliable without vendor-specific steps or user-provided selectors.

## Lessons / Next Steps
- Provide manual price entry/edit and CSV import/export to keep data usable when scraping fails.
  - Add “Set price” on the material/vendor link.
  - CSV ingest for bulk price updates from suppliers.
- Guided capture: let the user click the price in an embedded browser once, store that selector for future runs.
- Vendor feeds/APIs: allow configuring known feeds or endpoints when available.
- Optional advanced field for power users to supply selectors; hide for casual users.

## Run / Develop
```
npm install
npm run build
npm run dev   # runs renderer build/watch + electron
```

## Repo Notes
- The current scraper is heuristic-only and may not return correct prices; no vendor-specific logic is shipped.
- Default ZIP fallback is 97233; settings allow override.
