"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Search, SlidersHorizontal, X } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { buttonStyles } from "@/components/ui/GlassButton";
import { GlassCheckbox } from "@/components/ui/GlassInput";
import { cn } from "@/lib/utils";
import { content } from "@/content/site";
import { filterAndSort } from "@/lib/catalog";
import { BRAND_SETTINGS, whatsappLink } from "@/lib/brand";
import type { Branch, CatalogFilters, Category, Product, SortKey } from "@/lib/types";

const PAGE_SIZE = 8;

const SORT_KEYS: SortKey[] = ["featured", "price-asc", "price-desc", "name-asc"];

interface FilterPanelProps {
  labels: {
    selectBranch: string;
    meatType: string;
    allProducts: string;
    priceRange: string;
    onSaleOnly: string;
    inStockOnly: string;
    clearFilters: string;
  };
  branchId: string;
  branches: Branch[];
  onBranchChange: (id: string) => void;
  category: string;
  categories: Category[];
  categoryCounts: Map<string, number>;
  onCategory: (id: string) => void;
  onSaleOnly: boolean;
  setOnSaleOnly: (value: boolean) => void;
  inStockOnly: boolean;
  setInStockOnly: (value: boolean) => void;
  minRs: string;
  maxRs: string;
  setMinRs: (value: string) => void;
  setMaxRs: (value: string) => void;
  priceBounds: { min: number; max: number };
  hasFilters: boolean;
  onClear: () => void;
}

function FilterPanel({
  labels,
  branchId,
  branches,
  onBranchChange,
  category,
  categories,
  categoryCounts,
  onCategory,
  onSaleOnly,
  setOnSaleOnly,
  inStockOnly,
  setInStockOnly,
  minRs,
  maxRs,
  setMinRs,
  setMaxRs,
  priceBounds,
  hasFilters,
  onClear,
}: FilterPanelProps) {
  const rows = [{ id: "all", name: labels.allProducts }, ...categories];
  const field =
    "w-full rounded-full border border-line/15 bg-white/[0.06] px-4 py-2.5 text-sm text-ink backdrop-blur-xl focus:border-accent2/60 focus:outline-none";

  return (
    <div className="space-y-6 text-sm">
      <div>
        <label htmlFor="filter-branch" className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-accent2">
          {labels.selectBranch}
        </label>
        <select id="filter-branch" value={branchId} onChange={(event) => onBranchChange(event.target.value)} className={field}>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>{branch.name}</option>
          ))}
        </select>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent2">{labels.meatType}</p>
        <ul className="space-y-1">
          {rows.map((row) => {
            const active = category === row.id;
            return (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => onCategory(row.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-full px-3 py-2 text-left transition-colors",
                    active ? "bg-accent text-on-accent" : "text-muted hover:bg-white/[0.06] hover:text-ink"
                  )}
                >
                  <span>{row.name}</span>
                  <span className="text-xs opacity-70">{categoryCounts.get(row.id) ?? 0}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent2">{labels.priceRange}</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            value={minRs}
            onChange={(event) => setMinRs(event.target.value)}
            placeholder={String(priceBounds.min)}
            aria-label={`${labels.priceRange} minimum`}
            className={field}
          />
          <span className="text-muted">–</span>
          <input
            type="number"
            inputMode="numeric"
            value={maxRs}
            onChange={(event) => setMaxRs(event.target.value)}
            placeholder={String(priceBounds.max)}
            aria-label={`${labels.priceRange} maximum`}
            className={field}
          />
        </div>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2.5 text-muted">
          <GlassCheckbox checked={onSaleOnly} onChange={(event) => setOnSaleOnly(event.target.checked)} />
          {labels.onSaleOnly}
        </label>
        <label className="flex items-center gap-2.5 text-muted">
          <GlassCheckbox checked={inStockOnly} onChange={(event) => setInStockOnly(event.target.checked)} />
          {labels.inStockOnly}
        </label>
      </div>

      {hasFilters ? (
        <button type="button" onClick={onClear} className={cn(buttonStyles("secondary", "sm"), "w-full")}>
          {labels.clearFilters}
        </button>
      ) : null}
    </div>
  );
}

interface ShopClientProps {
  products: Product[];
  categories: Category[];
  branches: Branch[];
  branchId: string;
  initialQuery: string;
  initialCategory: string;
}

export function ShopClient({
  products,
  categories,
  branches,
  branchId,
  initialQuery,
  initialCategory,
}: ShopClientProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minRs, setMinRs] = useState("");
  const [maxRs, setMaxRs] = useState("");
  const [sort, setSort] = useState<SortKey>("featured");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [showFilters, setShowFilters] = useState(false);

  const labels = content.shop.labels;

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    counts.set("all", products.length);
    for (const product of products) {
      if (!product.categoryId) continue;
      counts.set(product.categoryId, (counts.get(product.categoryId) ?? 0) + 1);
    }
    return counts;
  }, [products]);

  const priceBounds = useMemo(() => {
    if (products.length === 0) return { min: 0, max: 0 };
    const prices = products.map((product) => product.effectivePricePaisa / 100);
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [products]);

  const filtered = useMemo(() => {
    const toPaisa = (value: string): number | null => {
      if (!value.trim()) return null;
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) : null;
    };

    const filters: CatalogFilters = {
      categoryId: category,
      query,
      onSaleOnly,
      inStockOnly,
      minPaisa: toPaisa(minRs),
      maxPaisa: toPaisa(maxRs),
      sort,
    };

    return filterAndSort(products, filters);
  }, [products, category, query, onSaleOnly, inStockOnly, minRs, maxRs, sort]);

  // Any filter change starts the list over rather than leaving a stale page depth.
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [category, query, onSaleOnly, inStockOnly, minRs, maxRs, sort]);

  const hasFilters =
    category !== "all" || query.trim() !== "" || onSaleOnly || inStockOnly || minRs !== "" || maxRs !== "";

  const clearFilters = () => {
    setQuery("");
    setCategory("all");
    setOnSaleOnly(false);
    setInStockOnly(false);
    setMinRs("");
    setMaxRs("");
    setSort("featured");
  };

  const changeBranch = (nextBranchId: string) => {
    const params = new URLSearchParams();
    if (nextBranchId !== branchId) params.set("branch", nextBranchId);
    if (query.trim()) params.set("q", query.trim());
    if (category !== "all") params.set("category", category);
    const search = params.toString();
    router.push(search ? `/shop?${search}` : "/shop");
  };

  const visibleProducts = filtered.slice(0, visible);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <GlassCard variant="strong" spotlight padding="lg" className="mb-8">
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent2">
                {labels.browse}
              </p>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                {content.shop.title}
              </h1>
              <p className="mt-1 text-sm text-muted">{content.shop.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(true)}
              className={cn(buttonStyles("glass", "md"), "lg:hidden")}
            >
              <SlidersHorizontal size={16} aria-hidden="true" />
              Filters
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <div className="glass-line flex items-center gap-2 rounded-full py-2 pl-4 pr-2">
              <Search size={18} aria-hidden="true" className="shrink-0 text-muted" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search products…"
                aria-label="Search products"
                className="min-w-0 flex-1 bg-transparent py-1.5 text-sm text-ink placeholder:text-muted focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="glass-line flex items-center gap-2 rounded-full px-4 py-2.5">
                <SlidersHorizontal size={15} aria-hidden="true" className="text-muted" />
                <span className="sr-only">{labels.sort}</span>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as SortKey)}
                  aria-label={labels.sort}
                  className="bg-transparent text-sm text-ink focus:outline-none"
                >
                  {SORT_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {content.shop.sortOptions[key]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategory("all")}
              data-active={category === "all"}
              className="chip"
            >
              All
            </button>
            {categories.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCategory(item.id)}
                data-active={category === item.id}
                className="chip"
              >
                {item.name}
              </button>
            ))}
          </div>

        </div>
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block">
          <GlassCard variant="strong" padding="md" className="sticky top-32 space-y-6">
            <FilterPanel
              labels={labels}
              branchId={branchId}
              branches={branches}
              onBranchChange={changeBranch}
              category={category}
              categories={categories}
              categoryCounts={categoryCounts}
              onCategory={setCategory}
              onSaleOnly={onSaleOnly}
              setOnSaleOnly={setOnSaleOnly}
              inStockOnly={inStockOnly}
              setInStockOnly={setInStockOnly}
              minRs={minRs}
              maxRs={maxRs}
              setMinRs={setMinRs}
              setMaxRs={setMaxRs}
              priceBounds={priceBounds}
              hasFilters={hasFilters}
              onClear={clearFilters}
            />
          </GlassCard>
        </aside>

        <div>
          <p className="mb-5 text-sm text-muted" aria-live="polite">
            {filtered.length} product{filtered.length === 1 ? "" : "s"}
          </p>

          {filtered.length === 0 ? (
            <GlassCard padding="lg" className="text-center">
              <p className="text-sm text-muted">{content.shop.empty}</p>
              {hasFilters ? (
                <button type="button" onClick={clearFilters} className={cn(buttonStyles("secondary", "md"), "mt-5")}>
                  {labels.clearFilters}
                </button>
              ) : null}
            </GlassCard>
          ) : (
            <>
              <ProductGrid
                products={visibleProducts}
                labels={{
                  sale: labels.sale,
                  inStock: labels.inStock,
                  outOfStock: labels.outOfStock,
                  lowStock: labels.lowStock,
                  addToCart: labels.addToCart,
                }}
                columnsClassName="sm:grid-cols-2 lg:grid-cols-3"
              />

              {visible < filtered.length ? (
                <div className="mt-10 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisible((value) => value + PAGE_SIZE)}
                    className={cn(buttonStyles("secondary", "md"), "glass")}
                  >
                    {labels.loadMore}
                  </button>
                </div>
              ) : null}
            </>
          )}

          <a
            href={whatsappLink(BRAND_SETTINGS.whatsapp, "Hi, I am looking for a specific cut.")}
            target="_blank"
            rel="noreferrer"
            className="glass mt-10 flex items-center gap-3 rounded-glass p-4 transition-all hover:-translate-y-1 hover:shadow-[0_0_32px_rgb(37_211_102/0.25)]"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-success/40 bg-success/15 text-success">
              <MessageCircle size={20} aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-ink">Can&apos;t find what you&apos;re looking for?</span>
              <span className="block text-xs text-muted">Message us on WhatsApp and we&apos;ll arrange it.</span>
            </span>
          </a>
        </div>
      </div>

      {showFilters ? (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowFilters(false)} />
          <div className="glass-strong absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-glass-lg p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink">Filters</h2>
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                aria-label="Close filters"
                className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-white/[0.06] hover:text-ink"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <FilterPanel
              labels={labels}
              branchId={branchId}
              branches={branches}
              onBranchChange={changeBranch}
              category={category}
              categories={categories}
              categoryCounts={categoryCounts}
              onCategory={setCategory}
              onSaleOnly={onSaleOnly}
              setOnSaleOnly={setOnSaleOnly}
              inStockOnly={inStockOnly}
              setInStockOnly={setInStockOnly}
              minRs={minRs}
              maxRs={maxRs}
              setMinRs={setMinRs}
              setMaxRs={setMaxRs}
              priceBounds={priceBounds}
              hasFilters={hasFilters}
              onClear={clearFilters}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
