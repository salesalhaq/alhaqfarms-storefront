import type { Metadata } from "next";
import Image from "next/image";
import { Beef, Sparkles } from "lucide-react";
import { CatalogPreviewNotice } from "@/components/ui/CatalogPreviewNotice";
import { ShopClient } from "@/components/shop/ShopClient";
import { content } from "@/content/site";
import { getCatalogSnapshot } from "@/lib/catalog";

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
