import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { app } from "electron";

export interface Vendor {
  id?: number;
  name: string;
  base_url?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Material {
  id?: number;
  name: string;
  category?: string;
  unit?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MaterialVendorLink {
  id?: number;
  material_id: number;
  vendor_id: number;
  sku?: string;
  product_url?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PriceRecord {
  id?: number;
  material_id: number;
  vendor_id: number;
  price: number;
  currency?: string;
  unit?: string;
  fetched_at: string;
}

export interface Project {
  id?: number;
  name: string;
  client_name?: string;
  address?: string;
  status?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectMaterial {
  id?: number;
  project_id: number;
  material_id: number;
  quantity: number;
  waste_factor?: number;
  preferred_vendor_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Alert {
  id?: number;
  material_id: number;
  vendor_id?: number | null;
  threshold_price?: number | null;
  change_percent?: number | null;
  direction?: "above" | "below" | "increase" | "decrease";
  enabled?: number;
  created_at?: string;
  updated_at?: string;
}

let db: Database.Database | null = null;

const createTableStatements = [
  `CREATE TABLE IF NOT EXISTS vendors (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    base_url TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS materials (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    unit TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS material_vendor_links (
    id INTEGER PRIMARY KEY,
    material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    sku TEXT,
    product_url TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS prices (
    id INTEGER PRIMARY KEY,
    material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    price REAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    unit TEXT,
    fetched_at DATETIME NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    client_name TEXT,
    address TEXT,
    status TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS project_materials (
    id INTEGER PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    quantity REAL NOT NULL,
    waste_factor REAL DEFAULT 0.0,
    preferred_vendor_id INTEGER REFERENCES vendors(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY,
    material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    vendor_id INTEGER REFERENCES vendors(id),
    threshold_price REAL,
    change_percent REAL,
    direction TEXT,
    enabled INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`
];

function ensureDbDir(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getDefaultDbPath() {
  const custom = process.env.BUILDBANK_DB_PATH;
  if (custom) return custom;
  const base = app ? app.getPath("userData") : path.join(process.cwd(), ".data");
  return path.join(base, "buildbank.db");
}

export function initDb(dbPath?: string) {
  const resolvedPath = dbPath || getDefaultDbPath();
  ensureDbDir(resolvedPath);
  db = new Database(resolvedPath);
  db.pragma("foreign_keys = ON");
  createTableStatements.forEach((sql) => db?.prepare(sql).run());
  return db;
}

export function getDb() {
  if (!db) {
    initDb();
  }
  return db!;
}

function now() {
  return new Date().toISOString();
}

export const VendorsRepository = {
  list(): Vendor[] {
    return getDb().prepare("SELECT * FROM vendors ORDER BY name ASC").all() as Vendor[];
  },
  create(data: Vendor): Vendor {
    const stmt = getDb().prepare(
      "INSERT INTO vendors (name, base_url, notes, created_at, updated_at) VALUES (@name, @base_url, @notes, @created_at, @updated_at)"
    );
    const timestamps = { created_at: now(), updated_at: now() };
    const info = stmt.run({ ...data, ...timestamps });
    return { ...data, ...timestamps, id: Number(info.lastInsertRowid) };
  },
  update(id: number, data: Partial<Vendor>): Vendor {
    const stmt = getDb().prepare(
      "UPDATE vendors SET name=@name, base_url=@base_url, notes=@notes, updated_at=@updated_at WHERE id=@id"
    );
    const updated_at = now();
    stmt.run({ id, ...data, updated_at });
    return this.get(id)!;
  },
  delete(id: number) {
    getDb().prepare("DELETE FROM vendors WHERE id=?").run(id);
  },
  get(id: number): Vendor | undefined {
    return getDb().prepare("SELECT * FROM vendors WHERE id=?").get(id) as Vendor | undefined;
  }
};

export const MaterialsRepository = {
  list(): Material[] {
    return getDb().prepare("SELECT * FROM materials ORDER BY name ASC").all() as Material[];
  },
  create(data: Material): Material {
    const stmt = getDb().prepare(
      "INSERT INTO materials (name, category, unit, description, created_at, updated_at) VALUES (@name, @category, @unit, @description, @created_at, @updated_at)"
    );
    const timestamps = { created_at: now(), updated_at: now() };
    const info = stmt.run({ ...data, ...timestamps });
    return { ...data, ...timestamps, id: Number(info.lastInsertRowid) };
  },
  update(id: number, data: Partial<Material>): Material {
    const stmt = getDb().prepare(
      "UPDATE materials SET name=@name, category=@category, unit=@unit, description=@description, updated_at=@updated_at WHERE id=@id"
    );
    const updated_at = now();
    stmt.run({ id, ...data, updated_at });
    return this.get(id)!;
  },
  delete(id: number) {
    getDb().prepare("DELETE FROM materials WHERE id=?").run(id);
  },
  get(id: number): Material | undefined {
    return getDb().prepare("SELECT * FROM materials WHERE id=?").get(id) as Material | undefined;
  }
};

export const LinksRepository = {
  listForMaterial(materialId: number): MaterialVendorLink[] {
    const stmt = getDb().prepare(
      "SELECT * FROM material_vendor_links WHERE material_id=? ORDER BY created_at DESC"
    );
    return stmt.all(materialId) as MaterialVendorLink[];
  },
  create(data: MaterialVendorLink): MaterialVendorLink {
    const stmt = getDb().prepare(
      "INSERT INTO material_vendor_links (material_id, vendor_id, sku, product_url, notes, created_at, updated_at) VALUES (@material_id, @vendor_id, @sku, @product_url, @notes, @created_at, @updated_at)"
    );
    const timestamps = { created_at: now(), updated_at: now() };
    const info = stmt.run({ ...data, ...timestamps });
    return { ...data, ...timestamps, id: Number(info.lastInsertRowid) };
  },
  delete(id: number) {
    getDb().prepare("DELETE FROM material_vendor_links WHERE id=?").run(id);
  }
};

export const PricesRepository = {
  insert(record: PriceRecord): PriceRecord {
    const stmt = getDb().prepare(
      "INSERT INTO prices (material_id, vendor_id, price, currency, unit, fetched_at) VALUES (@material_id, @vendor_id, @price, @currency, @unit, @fetched_at)"
    );
    const info = stmt.run(record);
    return { ...record, id: Number(info.lastInsertRowid) };
  },
  latestForMaterial(materialId: number) {
    const stmt = getDb().prepare(
      `SELECT p.* FROM prices p
       WHERE p.material_id = ?
       ORDER BY p.fetched_at DESC`
    );
    return stmt.all(materialId) as PriceRecord[];
  },
  priceHistory(materialId: number, vendorId: number, days: number) {
    const stmt = getDb().prepare(
      `SELECT * FROM prices
       WHERE material_id = @materialId AND vendor_id = @vendorId
         AND fetched_at >= datetime('now', '-' || @days || ' days')
       ORDER BY fetched_at ASC`
    );
    return stmt.all({ materialId, vendorId, days }) as PriceRecord[];
  }
};

export function getLatestPricesForMaterial(materialId: number) {
  const stmt = getDb().prepare(
    `SELECT vendor_id, MAX(fetched_at) as latest_at
     FROM prices WHERE material_id = ? GROUP BY vendor_id`
  );
  const rows = stmt.all(materialId) as { vendor_id: number; latest_at: string }[];
  return rows.map((r) => {
    const rec = getDb()
      .prepare(
        "SELECT * FROM prices WHERE material_id = @materialId AND vendor_id = @vendorId AND fetched_at = @fetched_at"
      )
      .get({ materialId, vendorId: r.vendor_id, fetched_at: r.latest_at }) as PriceRecord;
    return rec;
  });
}

export function getProjectCost(projectId: number) {
  const stmt = getDb().prepare(
    `SELECT pm.*, m.name as material_name,
      (pm.quantity * (1 + IFNULL(pm.waste_factor,0))) as total_quantity
     FROM project_materials pm
     JOIN materials m ON pm.material_id = m.id
     WHERE pm.project_id = ?`
  );
  const rows = stmt.all(projectId) as (ProjectMaterial & { material_name: string; total_quantity: number })[];
  const costLines = rows.map((row) => {
    const prices = getLatestPricesForMaterial(row.material_id);
    const price = prices[0]?.price ?? 0;
    return {
      ...row,
      latestPrice: price,
      lineTotal: row.total_quantity * price
    };
  });
  const total = costLines.reduce((acc, line) => acc + line.lineTotal, 0);
  return { lines: costLines, total };
}
