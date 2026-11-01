"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ShoppingCart, Info, Snowflake, ShieldCheck, Truck, MessageCircle } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { buttonStyles } from "@/components/ui/GlassButton";
import { QuantitySelector } from "./QuantitySelector";
import { ProductGrid } from "./ProductGrid";
import { Toast } from "@/components/ui/Toast";
import { useCart } from "@/lib/store";
import { formatPaisa, unitLabel, quantityStep, toDecimalQuantity, cn } from "@/lib/utils";
import { content } from "@/content/site";
import { BRAND_SETTINGS, whatsappLink } from "@/lib/brand";
import type { Product } from "@/lib/types";

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: Product[];
}

export function ProductDetailClient({ product, relatedProducts }: ProductDetailClientProps) {
  const { addItem } = useCart();
  const [quantityMilli, setQuantityMilli] = useState(quantityStep(product.unitCode) * 1000);
  const [notice, setNotice] = useState<string | null>(null);
  
  const handleAddToCart = () => {
    addItem(product, quantityMilli);
    setNotice(`Added ${toDecimalQuantity(quantityMilli)} ${product.unitCode} of ${product.name} to cart`);
  };

  const soldOut = product.stockMilli !== null && product.stockMilli <= 0;
  const step = quantityStep(product.unitCode);
  const weightChips = [1, 2, 5].map((n) => n * step * 1000);
  const liveTotal = (product.effectivePricePaisa * quantityMilli) / 1000;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20">
      {/* Top Bar / Breadcrumb */}
      <div className="mb-8 flex items-center justify-between">
        <Link
          href="/shop"
          className="flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft size={16} />
          {content.productDetail.backToShop}
        </Link>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        {/* Left: Product Info (Sticky) */}
        <div className="lg:sticky lg:top-32 lg:h-fit">
          <div className="flex flex-col gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <GlassBadge tone="crimson">{product.categoryName}</GlassBadge>
                <GlassBadge tone="gold">
                  <Snowflake size={12} aria-hidden="true" />
                  Fresh Cut Daily
                </GlassBadge>
              </div>
              <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
                {product.name}
              </h1>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-gold-gradient text-3xl font-extrabold">
                {formatPaisa(product.effectivePricePaisa)}
              </span>
              <span className="text-sm text-muted">per {unitLabel(product.unitCode)}</span>
              {product.onSale && (
                <span className="text-sm text-muted line-through">
                  {formatPaisa(product.pricePaisa)}
                </span>
              )}
            </div>

            {product.description && (
              <p className="text-base leading-relaxed text-muted">
                {product.description}
              </p>
            )}

            <GlassCard padding="md" className="space-y-5">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Quick select
                </p>
                <div className="flex flex-wrap gap-2">
                  {weightChips.map((milli) => (
                    <button
                      key={milli}
                      type="button"
                      onClick={() => setQuantityMilli(milli)}
                      data-active={quantityMilli === milli}
                      className="chip"
                    >
                      {toDecimalQuantity(milli)} {product.unitCode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-line/10 pt-4">
                <span className="text-sm font-medium text-ink">Quantity</span>
                <QuantitySelector
                  unitCode={product.unitCode}
                  quantityMilli={quantityMilli}
                  onChange={setQuantityMilli}
                  maxMilli={product.stockMilli}
                />
              </div>

              <div className="flex items-center justify-between border-t border-line/10 pt-4">
                <span className="text-sm font-medium text-ink">Total</span>
                <motion.span
                  key={liveTotal}
                  initial={{ opacity: 0.4, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-2xl font-extrabold text-accent2"
                >
                  {formatPaisa(liveTotal)}
                </motion.span>
              </div>

              <button
                type="button"
                disabled={soldOut}
                onClick={handleAddToCart}
                className={cn(buttonStyles("primary", "lg"), "w-full disabled:opacity-50")}
              >
                <ShoppingCart size={20} aria-hidden="true" />
                {soldOut ? content.shop.labels.outOfStock : content.shop.labels.addToCart}
              </button>

              <div className="flex items-center gap-2 rounded-glass bg-white/[0.05] p-3 text-xs text-muted">
                <Info size={14} className="shrink-0 text-accent2" />
                <span>
                  {soldOut
                    ? "This item is currently out of stock at your selected branch."
                    : `In stock: ${toDecimalQuantity(product.stockMilli ?? 0)} ${product.unitCode} available.`}
                </span>
              </div>
            </GlassCard>

            <div className="glass-crimson rounded-glass p-5">
              <p className="text-lg font-bold text-ink">Ready to Order?</p>
              <p className="mt-1 text-sm text-ink/75">
                Message us on WhatsApp and we&apos;ll prepare your order for delivery.
              </p>
              <a
                href={whatsappLink(
                  BRAND_SETTINGS.whatsapp,
                  `Hi! I'd like to order ${toDecimalQuantity(quantityMilli)} ${product.unitCode} of ${product.name}.`
                )}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-success/45 bg-success/15 px-5 py-2.5 text-sm font-medium text-success backdrop-blur-xl transition-all hover:bg-success/25"
              >
                <MessageCircle size={16} aria-hidden="true" />
                Order on WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Right: Gallery & Scrollytelling */}
        <div className="space-y-12">
          {/* Main Media */}
          <GlassCard padding="none" className="group relative aspect-square overflow-hidden">
            {product.imagePath ? (
              <Image
                src={product.imagePath}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 560px"
                className="photo-treat object-cover transition-transform duration-700 ease-spring group-hover:scale-110"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent/20 via-transparent to-accent2/20">
                <span className="text-8xl font-bold text-ink/20">{product.name.charAt(0)}</span>
              </div>
            )}
            <div className="photo-vignette" aria-hidden="true" />
          </GlassCard>

          <div className="grid grid-cols-3 gap-3">
            {[
              { Icon: Truck, label: "Same-day delivery" },
              { Icon: Snowflake, label: "Cold-chain packed" },
              { Icon: ShieldCheck, label: "100% Halal" },
            ].map((item) => (
              <GlassCard key={item.label} padding="sm" className="flex flex-col items-center gap-2 text-center">
                <span className="grid h-10 w-10 place-items-center rounded-full border border-line/15 bg-white/[0.06] text-accent2">
                  <item.Icon size={18} strokeWidth={1.5} aria-hidden="true" />
                </span>
                <span className="text-xs font-medium text-muted">{item.label}</span>
              </GlassCard>
            ))}
          </div>

          {/* Scrollytelling Story */}
          <div className="space-y-24 py-12">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-ink">{content.productDetail.story.heading}</h2>
              <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-accent" />
            </div>

            {content.productDetail.story.steps.map((step, idx) => (
              <div key={step.id} className="grid gap-8 md:grid-cols-2 md:items-center">
                <div className={cn(idx % 2 === 0 ? "md:order-1" : "md:order-2")}>
                  <div className="relative aspect-video overflow-hidden rounded-glass bg-line/5">
                     {/* Placeholder for story step images */}
                     <div className="flex h-full w-full items-center justify-center opacity-20">
                        <span className="text-4xl font-bold">{step.title.charAt(0)}</span>
                     </div>
                  </div>
                </div>
                <div className={cn(idx % 2 === 0 ? "md:order-2" : "md:order-1")}>
                  <h3 className="text-xl font-bold text-ink">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    {step.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-24 border-t border-line/10 pt-16">
          <h2 className="mb-10 text-2xl font-bold text-ink">
            {content.productDetail.relatedHeading}
          </h2>
          <ProductGrid
            products={relatedProducts}
            labels={content.shop.labels}
          />
        </section>
      )}

      <Toast message={notice} onDismiss={() => setNotice(null)} />
    </div>
  );
}
