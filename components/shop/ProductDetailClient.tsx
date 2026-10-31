"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ShoppingCart, Info } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { QuantitySelector } from "./QuantitySelector";
import { ProductGrid } from "./ProductGrid";
import { Toast } from "@/components/ui/Toast";
import { useCart } from "@/lib/store";
import { formatPaisa, unitLabel, quantityStep, toDecimalQuantity, cn } from "@/lib/utils";
import { content } from "@/content/site";
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
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                {product.categoryName}
              </p>
              <h1 className="mt-2 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
                {product.name}
              </h1>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-ink">
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
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-ink">Quantity</span>
                <QuantitySelector
                  unitCode={product.unitCode}
                  quantityMilli={quantityMilli}
                  onChange={setQuantityMilli}
                  maxMilli={product.stockMilli}
                />
              </div>

              <div className="flex items-center justify-between border-t border-line/10 pt-4">
                <span className="text-sm font-medium text-ink">Subtotal</span>
                <span className="text-xl font-bold text-ink">
                  {formatPaisa((product.effectivePricePaisa * quantityMilli) / 1000)}
                </span>
              </div>

              <GlassButton
                className="w-full"
                size="lg"
                disabled={soldOut}
                onClick={handleAddToCart}
              >
                <ShoppingCart size={20} className="mr-2" />
                {soldOut ? content.shop.labels.outOfStock : content.shop.labels.addToCart}
              </GlassButton>

              <div className="flex items-center gap-2 rounded-lg bg-accent/5 p-3 text-xs text-muted">
                <Info size={14} className="shrink-0 text-accent" />
                <span>
                  {soldOut
                    ? "This item is currently out of stock at your selected branch."
                    : `In stock: ${toDecimalQuantity(product.stockMilli ?? 0)} ${product.unitCode} available.`}
                </span>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Right: Gallery & Scrollytelling */}
        <div className="space-y-12">
          {/* Main Media */}
          <GlassCard padding="none" className="aspect-square overflow-hidden">
            {product.imagePath ? (
              <Image
                src={product.imagePath}
                alt={product.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent/20 via-transparent to-accent2/20">
                <span className="text-8xl font-bold text-ink/20">{product.name.charAt(0)}</span>
              </div>
            )}
          </GlassCard>

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
