/**
 * Storefront-facing types.
 *
 * These are normalised views over the desktop app's schema: the desktop and
 * Supabase store booleans as INTEGER 0/1, and money as integer paisa. Raw rows
 * are converted once at the boundary (see lib/catalog.ts) so components never
 * have to think about it.
 */

export interface Product {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  categoryId: string | null;
  categoryName: string | null;
  unitCode: string;
  unitDisplayName: string;
  /** Normal (non-sale) price in paisa. */
  pricePaisa: number;
  onSale: boolean;
  /** Sale price in paisa, only when the product is on sale. */
  salePricePaisa: number | null;
  /** Price a customer pays today: sale price when on sale, otherwise normal. */
  effectivePricePaisa: number;
  taxRateBps: number;
  imagePath: string | null;
  isActive: boolean;
  /** Stock in milli-units for the branch the customer selected. */
  stockMilli: number | null;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
}

export interface Branch {
  id: string;
  code: string;
  name: string;
  address: string | null;
  phone: string | null;
  isDefault: boolean;
}

export type SortKey = "featured" | "price-asc" | "price-desc" | "name-asc";

export interface CatalogFilters {
  categoryId: string | "all";
  query: string;
  onSaleOnly: boolean;
  inStockOnly: boolean;
  minPaisa: number | null;
  maxPaisa: number | null;
  sort: SortKey;
}

export interface CartItem {
  productId: string;
  name: string;
  unitCode: string;
  pricePaisa: number;
  quantityMilli: number;
  imagePath: string | null;
}
