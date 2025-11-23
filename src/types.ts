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

export interface UpdatePricesResult {
  success: boolean;
  updatedAt: string;
  count: number;
  failed?: number;
  errors?: {
    vendorId: number;
    materialId: number;
    vendorName: string;
    materialName: string;
    message: string;
    url?: string;
  }[];
}

export type LastUpdateResponse = string | null;

export type SettingsKey = "location_zip";

export interface VendorConfig {
  id?: number;
  vendor_id: number;
  price_selectors?: string | null;
  location_triggers?: string | null;
  zip_inputs?: string | null;
  store_result_selectors?: string | null;
  search_url_template?: string | null;
}
