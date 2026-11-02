import type { Branch, CatalogFilters, Category, Product, SortKey } from "./types";
import { getSupabase, isSupabaseConfigured } from "./supabase";

/**
 * Sample catalog for local development and design review.
 *
 * These are entirely fake products and branches — never real customer data.
 * Money is in paisa, stock is in milli-units, matching the desktop app.
 *
 * Production catalog reads use the storefront-safe Supabase views; the sample
 * data is only used for local preview when Supabase is not configured.
 */

export const SAMPLE_CATEGORIES: Category[] = [
  {
    id: "cat-meat",
    name: "Premium Meats",
    description: "Beef and mutton, cut to order and packed hygienically.",
  },
  {
    id: "cat-poultry",
    name: "Fresh Poultry",
    description: "Chicken and eggs from partner farms, delivered fresh.",
  },
  {
    id: "cat-dairy",
    name: "Farm Dairy",
    description: "Milk, yogurt and butter from our own herd.",
  },
  {
    id: "cat-spices",
    name: "Authentic Spices",
    description: "Authentic seasonings and ground spice powders.",
  },
  {
    id: "cat-marinated",
    name: "Marinated Items",
    description: "Ready-to-cook items prepared for your convenience.",
  },
  {
    id: "cat-vegetables",
    name: "Farm Vegetables",
    description: "Daily collected fresh produce direct from our farm.",
  },
  {
    id: "cat-ready",
    name: "Ready to Eat",
    description: "Fully cooked, hygienic meal options for instant enjoyment.",
  },
];

export const SAMPLE_BRANCHES: Branch[] = [
  {
    id: "br-akora",
    code: "AKR",
    name: "Akora Khattak",
    address: "Main Bazaar, Akora Khattak, Nowshera",
    phone: "+92 333 3867073",
    isDefault: true,
  },
  {
    id: "br-nowshera",
    code: "NSR",
    name: "Nowshera City",
    address: "Saddar Road, Nowshera",
    phone: "+92 333 3867074",
    isDefault: false,
  },
];

interface SampleProductInput {
  id: string;
  name: string;
  sku: string;
  description: string;
  categoryId: string;
  unitCode: string;
  unitDisplayName: string;
  pricePaisa: number;
  salePricePaisa?: number;
  taxRateBps?: number;
  /** Stock in milli-units, keyed by branch id. Missing branch means none. */
  stockMilli: Record<string, number>;
}

const SAMPLE_INPUT: SampleProductInput[] = [
  {
    id: "p-beef-boneless",
    name: "Beef Boneless",
    sku: "BEF-BON",
    description: "Lean boneless beef, trimmed and vacuum packed.",
    categoryId: "cat-meat",
    unitCode: "kg",
    unitDisplayName: "Kilogram",
    pricePaisa: 165000,
    stockMilli: { "br-akora": 48000, "br-nowshera": 25000 },
  },
  {
    id: "p-beef-bonein",
    name: "Beef Bone-In",
    sku: "BEF-BIN",
    description: "Fresh beef with bone, ideal for traditional stews.",
    categoryId: "cat-meat",
    unitCode: "kg",
    unitDisplayName: "Kilogram",
    pricePaisa: 140000,
    salePricePaisa: 120000,
    stockMilli: { "br-akora": 60000, "br-nowshera": 35000 },
  },
  {
    id: "p-mutton-bonein",
    name: "Mutton Bone-In",
    sku: "MUT-BIN",
    description: "Premium mutton with bone, cut fresh on the day of dispatch.",
    categoryId: "cat-meat",
    unitCode: "kg",
    unitDisplayName: "Kilogram",
    pricePaisa: 220000,
    salePricePaisa: 200000,
    stockMilli: { "br-akora": 25000, "br-nowshera": 15000 },
  },
  {
    id: "p-chicken-whole",
    name: "Full Chicken",
    sku: "CHK-WHL",
    description: "Whole dressed chicken, available in 1 kg birds.",
    categoryId: "cat-poultry",
    unitCode: "kg",
    unitDisplayName: "Kilogram",
    pricePaisa: 45000,
    stockMilli: { "br-akora": 55000, "br-nowshera": 33000 },
  },
  {
    id: "p-eggs",
    name: "Farm Fresh Eggs",
    sku: "EGG-DOZ",
    description: "Fresh farm eggs, sold by the dozen.",
    categoryId: "cat-poultry",
    unitCode: "dozen",
    unitDisplayName: "Dozen",
    pricePaisa: 36000,
    salePricePaisa: 33000,
    stockMilli: { "br-akora": 120000, "br-nowshera": 84000 },
  },
  {
    id: "p-milk",
    name: "Fresh Whole Milk",
    sku: "MLK-LTR",
    description: "Chilled full-cream milk from our own herd.",
    categoryId: "cat-dairy",
    unitCode: "ltr",
    unitDisplayName: "Litre",
    pricePaisa: 26000,
    salePricePaisa: 25000,
    stockMilli: { "br-akora": 200000, "br-nowshera": 150000 },
  },
  {
    id: "p-chili-powder",
    name: "Authentic Red Chili Powder",
    sku: "SPC-CHL",
    description: "Authentic sun-dried red chilies, ground to a fine powder.",
    categoryId: "cat-spices",
    unitCode: "pack",
    unitDisplayName: "Pack",
    pricePaisa: 11800,
    salePricePaisa: 10620,
    stockMilli: { "br-akora": 90000, "br-nowshera": 60000 },
  },
  {
    id: "p-tikka-boti",
    name: "Marinated Chicken Tikka",
    sku: "MAR-TIK",
    description: "Chicken cubes marinated in authentic spices, ready to grill.",
    categoryId: "cat-marinated",
    unitCode: "pack",
    unitDisplayName: "Pack",
    pricePaisa: 85000,
    stockMilli: { "br-akora": 20000, "br-nowshera": 10000 },
  },
  {
    id: "p-tomatoes",
    name: "Farm Fresh Tomatoes",
    sku: "VEG-TOM",
    description: "Red, ripe tomatoes collected daily from our farm.",
    categoryId: "cat-vegetables",
    unitCode: "kg",
    unitDisplayName: "Kilogram",
    pricePaisa: 12000,
    stockMilli: { "br-akora": 100000, "br-nowshera": 50000 },
  },
  {
    id: "p-beef-pulao",
    name: "Ready Beef Pulao",
    sku: "RDY-PLU",
    description: "Hygienically cooked beef pulao, ready to eat.",
    categoryId: "cat-ready",
    unitCode: "pack",
    unitDisplayName: "Pack",
    pricePaisa: 45000,
    stockMilli: { "br-akora": 15000, "br-nowshera": 5000 },
  },
];

function toProduct(input: SampleProductInput, branchId: string | null): Product {
  const onSale = typeof input.salePricePaisa === "number";
  const category = SAMPLE_CATEGORIES.find((item) => item.id === input.categoryId);
  return {
    id: input.id,
    name: input.name,
    sku: input.sku,
    description: input.description,
    categoryId: input.categoryId,
    categoryName: category?.name ?? null,
    unitCode: input.unitCode,
    unitDisplayName: input.unitDisplayName,
    pricePaisa: input.pricePaisa,
    onSale,
    salePricePaisa: onSale ? (input.salePricePaisa as number) : null,
    effectivePricePaisa: onSale ? (input.salePricePaisa as number) : input.pricePaisa,
    taxRateBps: input.taxRateBps ?? 0,
    imagePath: null,
    isActive: true,
    stockMilli:
      branchId === null ? null : input.stockMilli[branchId] ?? 0,
  };
}

/** The sample catalog, with stock resolved for the selected branch. */
export function sampleProducts(branchId: string | null): Product[] {
  return SAMPLE_INPUT.map((input) => toProduct(input, branchId));
}

export function getProduct(id: string, branchId: string | null): Product | null {
  const input = SAMPLE_INPUT.find((i) => i.id === id);
  if (!input) return null;
  return toProduct(input, branchId);
}

export function getRelatedProducts(product: Product, branchId: string | null, limit = 4): Product[] {
  const all = sampleProducts(branchId);
  return all
    .filter((p) => p.id !== product.id && p.categoryId === product.categoryId)
    .slice(0, limit);
}

export function defaultBranchId(): string {
  return SAMPLE_BRANCHES.find((branch) => branch.isDefault)?.id ?? SAMPLE_BRANCHES[0].id;
}

export const LOW_STOCK_THRESHOLD_MILLI = 10000;

interface ProductCatalogRow {
  id: string;
  category_id: string | null;
  category_name: string | null;
  name: string;
  sku: string | null;
  unit_code: string;
  price_paisa: number;
  on_sale: boolean;
  discounted_price_paisa: number | null;
  tax_rate_bps: number;
  image_path: string | null;
  is_active: boolean;
}

interface CategoryRow {
  id: string;
  name: string;
  description: string | null;
}

interface BranchRow {
  id: string;
  code: string;
  name: string;
  address: string | null;
  phone: string | null;
  is_default: boolean;
}

interface BranchStockRow {
  product_id: string;
  stock_milli: number;
}

export interface CatalogSnapshot {
  products: Product[];
  categories: Category[];
  branches: Branch[];
  branchId: string;
  isSample: boolean;
}

function getSampleCatalogSnapshot(requestedBranchId?: string): CatalogSnapshot {
  const branchId = SAMPLE_BRANCHES.some((branch) => branch.id === requestedBranchId)
    ? requestedBranchId!
    : defaultBranchId();
  const categories = mapCategories(SAMPLE_CATEGORIES);
  const categoryIds = new Set(categories.map((category) => category.id));
  return {
    products: sampleProducts(branchId).filter(
      (product) =>
        isStorefrontCategory(product.categoryName) &&
        (!product.categoryId || categoryIds.has(product.categoryId))
    ),
    categories,
    branches: SAMPLE_BRANCHES,
    branchId,
    isSample: true,
  };
}

function isMissingStorefrontView(error: { code?: string; message: string }): boolean {
  const message = error.message.toLowerCase();
  return (
    (error.code === "PGRST205" && message.includes("storefront_")) ||
    (error.code === "PGRST106" && message.includes("storefront"))
  );
}

function mapCategories(rows: CategoryRow[]): Category[] {
  return rows
    .filter((category) => isStorefrontCategory(category.name))
    .map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
    }));
}

function isStorefrontCategory(name: string | null | undefined): boolean {
  return !name?.trim().toLowerCase().startsWith("raw");
}

export async function getStorefrontCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured) return SAMPLE_CATEGORIES;

  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is configured but its client is unavailable.");

  const categoryResult = await supabase
    .schema("storefront")
    .from("storefront_categories_view")
    .select("id,name,description")
    .order("sort_order")
    .order("name");

  if (categoryResult.error) {
    if (isMissingStorefrontView(categoryResult.error) && process.env.NODE_ENV === "development") {
      console.warn(
        "Supabase storefront views are not installed; using sample categories for local development."
      );
      return SAMPLE_CATEGORIES;
    }
    throw new Error(`Could not load storefront categories: ${categoryResult.error.message}`);
  }

  return mapCategories(categoryResult.data as CategoryRow[]);
}

function configuredProduct(row: ProductCatalogRow, stockMilli: number | null): Product {
  const onSale = row.on_sale && row.discounted_price_paisa !== null;
  const salePricePaisa = onSale ? Number(row.discounted_price_paisa) : null;
  const pricePaisa = Number(row.price_paisa);

  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    description: null,
    categoryId: row.category_id,
    categoryName: row.category_name,
    unitCode: row.unit_code,
    unitDisplayName: row.unit_code,
    pricePaisa,
    onSale,
    salePricePaisa,
    effectivePricePaisa: salePricePaisa ?? pricePaisa,
    taxRateBps: Number(row.tax_rate_bps),
    imagePath: row.image_path,
    isActive: row.is_active,
    stockMilli,
  };
}

export async function getCatalogSnapshot(requestedBranchId?: string): Promise<CatalogSnapshot> {
  if (!isSupabaseConfigured) {
    return getSampleCatalogSnapshot(requestedBranchId);
  }

  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is configured but its client is unavailable.");
  const storefront = supabase.schema("storefront");

  const [branchResult, categoryResult, productResult] = await Promise.all([
    storefront
      .from("storefront_branches_view")
      .select("id,code,name,address,phone,is_default")
      .order("is_default", { ascending: false })
      .order("name"),
    storefront
      .from("storefront_categories_view")
      .select("id,name,description")
      .order("sort_order")
      .order("name"),
    storefront
      .from("product_catalog_view")
      .select(
        "id,category_id,category_name,name,sku,unit_code,price_paisa,on_sale,discounted_price_paisa,tax_rate_bps,image_path,is_active"
      )
      .eq("is_active", true)
      .order("name"),
  ]);

  if (branchResult.error && isMissingStorefrontView(branchResult.error)) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "Supabase storefront views are not installed; using the clearly labeled sample catalog for local development."
      );
      return getSampleCatalogSnapshot(requestedBranchId);
    }
    throw new Error(
      "The Supabase storefront views are missing. Review and apply the approved storefront SQL before deployment."
    );
  }
  if (branchResult.error) throw new Error(`Could not load storefront branches: ${branchResult.error.message}`);
  if (categoryResult.error) throw new Error(`Could not load storefront categories: ${categoryResult.error.message}`);
  if (productResult.error) throw new Error(`Could not load the product catalog: ${productResult.error.message}`);

  const branches: Branch[] = (branchResult.data as BranchRow[]).map((branch) => ({
    id: branch.id,
    code: branch.code,
    name: branch.name,
    address: branch.address,
    phone: branch.phone,
    isDefault: branch.is_default,
  }));
  const categoryRows = categoryResult.data as CategoryRow[];
  const hiddenCategoryIds = new Set(
    categoryRows
      .filter((category) => !isStorefrontCategory(category.name))
      .map((category) => category.id)
  );
  const categories = mapCategories(categoryRows);
  const branchId =
    branches.find((branch) => branch.id === requestedBranchId)?.id ??
    branches.find((branch) => branch.isDefault)?.id ??
    branches[0]?.id;

  if (!branchId) {
    return { products: [], categories, branches, branchId: "", isSample: false };
  }

  const stockResult = await storefront
    .from("branch_stock_view")
    .select("product_id,stock_milli")
    .eq("branch_id", branchId);
  if (stockResult.error) throw new Error(`Could not load branch stock: ${stockResult.error.message}`);

  const stockByProduct = new Map(
    (stockResult.data as BranchStockRow[]).map((row) => [row.product_id, Number(row.stock_milli)])
  );
  const products = (productResult.data as ProductCatalogRow[])
    .filter((product) => product.is_active)
    .filter(
      (product) =>
        !hiddenCategoryIds.has(product.category_id ?? "") &&
        isStorefrontCategory(product.category_name)
    )
    .map((product) => configuredProduct(product, stockByProduct.get(product.id) ?? 0));

  return { products, categories, branches, branchId, isSample: false };
}

export function filterAndSort(products: Product[], filters: CatalogFilters): Product[] {
  const query = filters.query.trim().toLowerCase();

  const filtered = products.filter((product) => {
    if (filters.categoryId !== "all" && product.categoryId !== filters.categoryId) {
      return false;
    }
    if (query) {
      const haystack = `${product.name} ${product.sku ?? ""} ${product.categoryName ?? ""}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (filters.onSaleOnly && !product.onSale) return false;
    if (filters.inStockOnly && !(product.stockMilli === null || product.stockMilli > 0)) {
      return false;
    }
    if (filters.minPaisa !== null && product.effectivePricePaisa < filters.minPaisa) {
      return false;
    }
    if (filters.maxPaisa !== null && product.effectivePricePaisa > filters.maxPaisa) {
      return false;
    }
    return true;
  });

  return sortProducts(filtered, filters.sort);
}

export function sortProducts(products: Product[], sort: SortKey): Product[] {
  const sorted = [...products];
  switch (sort) {
    case "price-asc":
      return sorted.sort((a, b) => a.effectivePricePaisa - b.effectivePricePaisa);
    case "price-desc":
      return sorted.sort((a, b) => b.effectivePricePaisa - a.effectivePricePaisa);
    case "name-asc":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "featured":
    default:
      return sorted;
  }
}
