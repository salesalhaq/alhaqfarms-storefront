import type { CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  Clock,
  Leaf,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { buttonStyles } from "@/components/ui/GlassButton";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Counter } from "@/components/ui/Counter";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { SearchBar } from "@/components/shop/SearchBar";
import { CatalogPreviewNotice } from "@/components/ui/CatalogPreviewNotice";
import { content } from "@/content/site";
import { filterAndSort, getCatalogSnapshot } from "@/lib/catalog";
import { formatPaisa, unitLabel } from "@/lib/utils";
import type { CatalogFilters } from "@/lib/types";

export const dynamic = "force-dynamic";

const SERVICE_ICONS = [Leaf, ShieldCheck, Truck];
const TRUST_ICONS = [ShieldCheck, Truck, Clock];
const HERO_TRUST = [
  { Icon: ShieldCheck, label: "100% Halal Certified" },
  { Icon: Truck, label: "Same-day delivery" },
  { Icon: Leaf, label: "Farm fresh daily" },
  { Icon: Clock, label: "Open 9am - 10pm" },
];

export default async function HomePage() {
  const catalog = await getCatalogSnapshot();
  const products = catalog.products;

  const base: CatalogFilters = {
    categoryId: "all",
    query: "",
    onSaleOnly: false,
    inStockOnly: false,
    minPaisa: null,
    maxPaisa: null,
    sort: "featured",
  };

  const bestSellers = filterAndSort(products, base).slice(0, 8);
  const onSaleProducts = filterAndSort(products, { ...base, onSaleOnly: true });
  const onSale = onSaleProducts.slice(0, 4);
  const spotlight = onSale[0] ?? products[0];
  const saleBanner = `FLASH SALE: ${onSaleProducts.length} ${
    onSaleProducts.length === 1 ? "PRODUCT" : "PRODUCTS"
  } ON SALE TODAY!`;

  const gridLabels = {
    sale: content.shop.labels.sale,
    inStock: content.shop.labels.inStock,
    outOfStock: content.shop.labels.outOfStock,
    lowStock: content.shop.labels.lowStock,
    addToCart: content.shop.labels.addToCart,
  };

  return (
    <main>
      {catalog.isSample && (
        <div className="px-4 pt-4">
          <CatalogPreviewNotice />
        </div>
      )}
      {/* Hero */}
      <section className="px-4 pb-16 pt-4 sm:pt-8">
        <div className="hero-stage relative mx-auto max-w-6xl overflow-hidden rounded-glass-lg">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            {spotlight.imagePath ? (
              <Image
                src={spotlight.imagePath}
                alt=""
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 1152px"
                className="animate-ken-burns object-cover object-center opacity-45"
              />
            ) : null}
            <div className={`absolute inset-0 ${
              spotlight.imagePath
                ? "bg-gradient-to-r from-[#211719] via-[#291a1a]/90 to-[#2b1918]/45"
                : "bg-gradient-to-r from-[#211719]/95 via-[#291a1a]/75 to-[#4a2925]/35"
            }`} />
            <div className="absolute inset-0 bg-gradient-to-t from-[#211719]/70 via-transparent to-white/[0.04]" />
          </div>
          <div className="relative grid w-full items-center gap-10 px-6 py-10 sm:px-10 sm:py-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:px-14">
            <div className="max-w-2xl">
              {onSaleProducts.length > 0 ? (
                <GlassBadge className="origin-left scale-[1.2] motion-safe:animate-pulse border-white/25 bg-white/10 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.4)]">
                  <Sparkles size={16} aria-hidden="true" className="text-accent2" />
                  {saleBanner}
                </GlassBadge>
              ) : null}

            <h1 className="mt-6 text-5xl font-extrabold leading-[1.03] tracking-tight text-hero-gradient sm:text-6xl lg:text-7xl">
              {content.home.hero.headlineLines.map((line, index) => (
                <span
                  key={line}
                  className="mask-line"
                  style={{ "--d": `${index * 130}ms` } as CSSProperties}
                >
                  <span
                    className={
                      index === content.home.hero.headlineLines.length - 1
                        ? "text-crimson-gradient"
                        : undefined
                    }
                  >
                    {line}
                  </span>
                </span>
              ))}
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              {content.home.hero.text}
            </p>

            <div className="mt-8 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
              <Link
                href="/shop"
                className={buttonStyles("primary", "lg", "w-full motion-safe:animate-pulse")}
              >
                {content.home.hero.primaryCta}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link href="/products" className={buttonStyles("primary", "lg", "w-full")}>
                {content.home.hero.priceListCta}
              </Link>
              <Link href="/track" className={buttonStyles("primary", "lg", "w-full")}>
                {content.home.hero.trackCta}
              </Link>
            </div>

            <ul className="mt-8 grid max-w-lg grid-cols-2 gap-3 sm:grid-cols-4">
              {HERO_TRUST.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center gap-2.5 rounded-glass-sm border border-white/10 bg-white/[0.06] px-3 py-2.5 backdrop-blur-xl"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/15 bg-white/[0.08] text-accent2">
                    <item.Icon size={17} strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  <span className="text-xs font-medium leading-tight text-white/85">{item.label}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 max-w-lg [&_input]:border-white/20 [&_input]:bg-white/10 [&_input]:text-white [&_input]:placeholder:text-white/60 [&_button]:text-white">
              <SearchBar placeholder="Search beef, chicken, milk, spices…" />
            </div>
          </div>

          <div className="hero-glass w-full max-w-sm justify-self-center rounded-glass p-4 sm:p-5 lg:justify-self-end">
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
                  {content.shop.labels.sale}
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
                {content.shop.labels.browse}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 py-24">
        <div className="mx-auto grid w-full max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {content.home.stats.map((stat, index) => (
            <Reveal key={stat.label} delay={index * 80}>
              <GlassCard className="border-white/10 bg-white/5 text-center backdrop-blur-2xl">
                <p className="text-gold-gradient text-4xl font-extrabold tracking-tight">
                  <Counter to={stat.value} decimals={stat.decimals} suffix={stat.suffix} />
                </p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                  {stat.label}
                </p>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="px-4 py-24">
        <div className="mx-auto w-full max-w-6xl">
          <Reveal>
            <SectionHeading
              eyebrow="Categories"
              title={content.home.categories.heading}
              subtext={content.home.categories.subtext}
            />
          </Reveal>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {catalog.categories.map((category, index) => (
              <Reveal key={category.id} delay={index * 70} className="h-full">
                <Link href={`/shop?category=${category.id}`} className="block h-full">
                  <GlassCard interactive padding="lg" className="h-full">
                    <span
                      aria-hidden="true"
                      className="grid h-14 w-14 place-items-center rounded-glass-sm bg-gradient-to-br from-accent to-accent2 text-xl font-bold text-on-accent"
                    >
                      {category.name.charAt(0)}
                    </span>
                    <h3 className="mt-5 text-base font-semibold text-ink">{category.name}</h3>
                    {category.description ? (
                      <p className="mt-2 text-sm leading-relaxed text-muted">
                        {category.description}
                      </p>
                    ) : null}
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent">
                      {content.shop.labels.browse}
                      <ArrowRight size={15} aria-hidden="true" />
                    </span>
                  </GlassCard>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Best sellers */}
      <section className="px-4 py-24">
        <div className="mx-auto w-full max-w-6xl">
          <Reveal>
            <SectionHeading
              eyebrow="Popular"
              title={content.home.bestSellers.heading}
              subtext={content.home.bestSellers.subtext}
              align="left"
            />
          </Reveal>
          <Reveal className="mt-8">
            <ProductGrid
              products={bestSellers}
              labels={gridLabels}
            />
          </Reveal>
          <div className="mt-8 flex justify-center">
            <Link href="/shop" className={buttonStyles("secondary", "md")}>
              View all products
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* On sale */}
      {onSale.length > 0 ? (
        <section className="px-4 py-16">
          <div className="mx-auto w-full max-w-6xl">
            <Reveal>
              <SectionHeading
                eyebrow="Save today"
                title={content.home.onSale.heading}
                subtext={content.home.onSale.subtext}
                align="left"
              />
            </Reveal>
            <Reveal className="mt-8">
              <ProductGrid
                products={onSale}
                labels={gridLabels}
                columnsClassName="sm:grid-cols-2 lg:grid-cols-4"
              />
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* Services */}
      <section className="px-4 py-24">
        <div className="mx-auto w-full max-w-6xl">
          <Reveal>
            <SectionHeading
              eyebrow="What we do"
              title={content.home.services.heading}
              subtext={content.home.services.subtext}
            />
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {content.home.services.items.map((item, index) => {
              const Icon = SERVICE_ICONS[index] ?? Leaf;
              return (
                <Reveal key={item.title} delay={index * 80} className="h-full">
                  <GlassCard padding="lg" className="h-full">
                    <span className="grid h-12 w-12 place-items-center rounded-glass-sm bg-accent/15 text-accent">
                      <Icon size={22} aria-hidden="true" />
                    </span>
                    <h3 className="mt-5 text-base font-semibold text-ink">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{item.text}</p>
                  </GlassCard>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Delivery + heritage */}
      <section className="px-4 py-24">
        <div className="mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[1.4fr_1fr]">
          <Reveal className="h-full">
            <GlassCard padding="lg" className="h-full">
              <h2 className="text-2xl font-semibold tracking-tight text-ink">
                {content.home.delivery.heading}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
                {content.home.delivery.text}
              </p>
              <ul className="mt-6 space-y-3">
                {content.home.delivery.points.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm text-muted">
                    <Check size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-accent" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>
          </Reveal>

          <Reveal delay={80} className="h-full">
            <GlassCard padding="lg" className="flex h-full flex-col justify-center">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-accent">
                {content.home.heritage.since}
              </p>
              <p className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-ink">
                {content.home.heritage.heading}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                From our own farm and partner farms to your table, Al Haq Farms &amp; Meats keeps
                a short, clean chain.
              </p>
            </GlassCard>
          </Reveal>
        </div>
      </section>

      {/* Founder */}
      <section className="px-4 py-24">
        <div className="mx-auto w-full max-w-4xl">
          <Reveal>
            <GlassCard padding="none" className="grid overflow-hidden md:grid-cols-[240px_1fr]">
              <div className="relative min-h-[280px] md:min-h-full">
                <Image
                  src="/assets/brand/ceo.jpg"
                  alt={content.home.founder.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 240px"
                  className="object-cover object-top"
                />
              </div>
              <div className="p-6 sm:p-8">
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-accent">
                  {content.home.founder.heading}
                </p>
                <div className="mt-5 space-y-4">
                  {content.ceoMessage.map((paragraph) => (
                    <p key={paragraph} className="text-sm leading-relaxed text-muted">
                      {paragraph}
                    </p>
                  ))}
                </div>
                <div className="mt-6 border-t border-line/10 pt-5">
                  <p className="text-sm font-semibold text-ink">{content.home.founder.name}</p>
                  <p className="text-xs text-muted">{content.home.founder.role}</p>
                </div>
              </div>
            </GlassCard>
          </Reveal>
        </div>
      </section>

      {/* Trust */}
      <section className="px-4 pb-20 pt-8">
        <div className="mx-auto w-full max-w-6xl">
          <div className="grid gap-5 sm:grid-cols-3">
            {content.home.trust.map((item, index) => {
              const Icon = TRUST_ICONS[index] ?? ShieldCheck;
              return (
                <Reveal key={item.title} delay={index * 70}>
                  <GlassCard className="flex items-center gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-glass-sm bg-accent/15 text-accent">
                      <Icon size={20} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink">{item.title}</p>
                      <p className="text-xs text-muted">{item.text}</p>
                    </div>
                  </GlassCard>
                </Reveal>
              );
            })}
          </div>

        </div>
      </section>
    </main>
  );
}
