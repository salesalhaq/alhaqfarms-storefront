"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { buttonStyles } from "@/components/ui/GlassButton";
import { cn } from "@/lib/utils";
import { content } from "@/content/site";
import { filterAndSort } from "@/lib/catalog";
import type { Branch, CatalogFilters, Category, Product, SortKey } from "@/lib/types";

const PAGE_SIZE = 8;

const SORT_KEYS: SortKey[] = ["featured", "price-asc", "price-desc", "name-asc"];

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

  const labels = content.shop.labels;

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
      <GlassCard padding="lg" className="mb-8">
        <div className="flex flex-col gap-5">
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
                <span className="text-xs text-muted">{labels.selectBranch}</span>
                <select
                  value={branchId}
                  onChange={(event) => changeBranch(event.target.value)}
                  aria-label={labels.selectBranch}
                  className="bg-transparent text-sm text-ink focus:outline-none"
                >
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </label>

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

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={onSaleOnly}
                onChange={(event) => setOnSaleOnly(event.target.checked)}
                className="h-4 w-4 accent-[rgb(var(--accent))]"
              />
              {labels.onSaleOnly}
            </label>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(event) => setInStockOnly(event.target.checked)}
                className="h-4 w-4 accent-[rgb(var(--accent))]"
              />
              {labels.inStockOnly}
            </label>

            <div className="flex items-center gap-2 text-sm text-muted">
              <span>{labels.priceRange}</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={minRs}
                onChange={(event) => setMinRs(event.target.value)}
                placeholder="Min"
                aria-label={`Minimum ${labels.priceRange}`}
                className="glass-line w-20 rounded-full px-3 py-1.5 text-sm text-ink placeholder:text-muted focus:outline-none"
              />
              <span aria-hidden="true">–</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={maxRs}
                onChange={(event) => setMaxRs(event.target.value)}
                placeholder="Max"
                aria-label={`Maximum ${labels.priceRange}`}
                className="glass-line w-20 rounded-full px-3 py-1.5 text-sm text-ink placeholder:text-muted focus:outline-none"
              />
            </div>

            {hasFilters ? (
              <button type="button" onClick={clearFilters} className={buttonStyles("ghost", "sm")}>
                {labels.clearFilters}
              </button>
            ) : null}
          </div>
        </div>
      </GlassCard>

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
          />

          {visible < filtered.length ? (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={() => setVisible((value) => value + PAGE_SIZE)}
                className={buttonStyles("secondary", "md")}
              >
                {labels.loadMore}
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
