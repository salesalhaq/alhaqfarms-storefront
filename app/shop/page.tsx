import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Beef, Sparkles } from "lucide-react";
import { CatalogPreviewNotice } from "@/components/ui/CatalogPreviewNotice";
import { ShopClient } from "@/components/shop/ShopClient";
import { buttonStyles } from "@/components/ui/GlassButton";
import { content } from "@/content/site";
import { getCatalogSnapshot, filterAndSort } from "@/lib/catalog";
import { formatPaisa, unitLabel } from "@/lib/utils";
import type { CatalogFilters } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: content.shop.title,
  description: content.shop.subtitle,
};

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const requestedBranch = first(params.branch);
  const catalog = await getCatalogSnapshot(requestedBranch || undefined);
  const requestedCategory = first(params.category);
  const initialCategory = catalog.categories.some((item) => item.id === requestedCategory)
    ? requestedCategory
    : "all";
  const shopImage = catalog.products.find((product) => product.imagePath)?.imagePath ?? null;

  const base: CatalogFilters = {
    categoryId: "all",
    query: "",
    onSaleOnly: false,
    inStockOnly: false,
    minPaisa: null,
    maxPaisa: null,
    sort: "featured",
  };

  const onSaleProducts = filterAndSort(catalog.products, { ...base, onSaleOnly: true });
  const spotlight = onSaleProducts[0] ?? catalog.products[0];

  return (
    <main className="px-4 pb-20 pt-4">
      {catalog.isSample && <CatalogPreviewNotice />}
      <section className="hero-stage relative mx-auto mb-10 w-full max-w-6xl overflow-hidden rounded-glass-lg">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {shopImage ? (
            <Image
              src={shopImage}
              alt=""
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 1152px"
              className="object-cover opacity-45"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-r from-[#211719]/95 via-[#291a1a]/85 to-[#4a2925]/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#211719]/45 to-transparent" />
        </div>
        <div className="relative flex min-h-52 items-end justify-between gap-6 px-6 py-8 sm:min-h-64 sm:px-10 sm:py-10">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#f3cf83]">
              <Sparkles size={14} aria-hidden="true" />
              Fresh from our farms
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              {content.shop.title}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
              {content.shop.subtitle}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["100% Halal", "Freshly prepared", "Same-day delivery"].map((item) => (
                <span key={item} className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs text-white/90 backdrop-blur-lg">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <span className="hero-glass hidden h-20 w-20 shrink-0 place-items-center rounded-full text-accent sm:grid">
            <Beef size={34} strokeWidth={1.4} aria-hidden="true" />
          </span>
        </div>
      </section>

      {/* Product of the day */}
      <section className="px-4 py-12">
        <div className="mx-auto w-full max-w-6xl">
          <div className="hero-glass w-full max-w-sm mx-auto rounded-glass p-4 sm:p-5">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-accent">
              Coming soon ..........
            </p>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-accent">
              Today&rsquo;s pick
            </p>
            <div className="relative mt-3 aspect-[16/9] w-full overflow-hidden rounded-glass-sm border border-line/15 bg-gradient-to-br from-accent/15 via-transparent to-accent2/10">
              {spotlight.imagePath ? (
                <Image
                  src={spotlight.imagePath}
                  alt={spotlight.name}
                  fill
                  sizes="(max-width: 1024px) 90vw, 420px"
                  className="photo-treat object-cover"
                />
              ) : (
                <span aria-hidden="true" className="absolute inset-0 grid place-items-center">
                  <span className="grid h-20 w-20 place-items-center rounded-full border border-line/15 bg-white/[0.06] text-accent2 backdrop-blur-2xl">
                    <Sparkles size={32} strokeWidth={1.25} />
                  </span>
                </span>
              )}
              {spotlight.onSale && (
                <span className="absolute left-3 top-3 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white shadow-lg">
                  Sale
                </span>
              )}
            </div>
            <h2 className="mt-3 text-lg font-semibold text-ink">{spotlight.name}</h2>
            {spotlight.description && (
              <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">{spotlight.description}</p>
            )}
            <div className="mt-3 flex items-end justify-between gap-4">
              <div>
                <p className="text-xl font-semibold text-accent">
                  {formatPaisa(spotlight.effectivePricePaisa)}
                </p>
                <p className="text-xs text-muted">
                  {spotlight.onSale && spotlight.salePricePaisa !== null ? (
                    <span className="mr-1 line-through">{formatPaisa(spotlight.pricePaisa)}</span>
                  ) : null}
                  per {unitLabel(spotlight.unitCode)}
                </p>
              </div>
              <Link
                href={`/shop?category=${spotlight.categoryId}`}
                className={buttonStyles("primary", "sm")}
              >
                Browse
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <ShopClient
        products={catalog.products}
        categories={catalog.categories}
        branches={catalog.branches}
        branchId={catalog.branchId}
        initialQuery={first(params.q)}
        initialCategory={initialCategory}
      />
    </main>
  );
}
