"use client";

import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { GlassButton } from "./GlassButton";
import { GlassCard } from "./GlassCard";
import { cn, formatPaisa, formatQuantity, isFractionalUnit, unitLabel } from "@/lib/utils";
import { LOW_STOCK_THRESHOLD_MILLI } from "@/lib/catalog";
import type { Product } from "@/lib/types";

type StockState = "in" | "low" | "out" | "unknown";

function stockState(product: Product): StockState {
  if (product.stockMilli === null) return "unknown";
  if (product.stockMilli <= 0) return "out";
  if (product.stockMilli <= LOW_STOCK_THRESHOLD_MILLI) return "low";
  return "in";
}

interface ProductCardProps {
  product: Product;
  labels: {
    sale: string;
    inStock: string;
    outOfStock: string;
    lowStock: string;
    addToCart: string;
  };
  onAddToCart: (product: Product) => void;
}

export function ProductCard({ product, labels, onAddToCart }: ProductCardProps) {
  const stock = stockState(product);
  const soldOut = stock === "out";
  const perUnit = `per ${unitLabel(product.unitCode)}`;

  const stockLabel =
    stock === "out" ? labels.outOfStock : stock === "low" ? labels.lowStock : labels.inStock;
  // Tinted border/background carries the meaning; the label stays on `ink` so
  // it reads correctly in both light and dark mode.
  const stockTone =
    stock === "out"
      ? "border-red-400/45 bg-red-500/15 text-ink"
      : stock === "low"
        ? "border-amber-400/45 bg-amber-500/15 text-ink"
        : "border-emerald-400/45 bg-emerald-500/15 text-ink";

  return (
    <GlassCard
      as="article"
      interactive
      padding="none"
      className="group flex h-full flex-col overflow-hidden border-[#eadfd5] bg-white/80 shadow-[0_14px_38px_-28px_rgb(74_37_29/0.32)]"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#efe6dc]">
        {product.imagePath ? (
          <Image
            src={product.imagePath}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 ease-spring group-hover:scale-[1.06]"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_55%_45%,rgb(var(--accent2)/0.28),transparent_58%),linear-gradient(145deg,#f3e7d6,#ead9ca_48%,#d9bfb1)]">
            <span
              aria-hidden="true"
              className="absolute inset-0 grid place-items-center text-5xl font-semibold text-accent/40"
            >
              {product.name.charAt(0)}
            </span>
          </div>
        )}

        <span className="absolute left-3 top-3 flex flex-col items-start gap-2">
          {product.onSale ? (
            <span className="rounded-full bg-accent px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-wide text-on-accent shadow-md">
              {labels.sale}
            </span>
          ) : null}
          <span
            className={cn(
              "rounded-full border border-white/55 px-2.5 py-1 text-[0.6875rem] font-medium shadow-sm backdrop-blur-xl",
              stockTone
            )}
          >
            {stockLabel}
          </span>
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div>
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-accent/80">
            {product.categoryName ?? ""}
          </p>
          <h3 className="mt-1 text-base font-semibold leading-snug text-ink">{product.name}</h3>
        </div>

        {product.description ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted">{product.description}</p>
        ) : null}

        <p className="text-xs text-muted">
          {isFractionalUnit(product.unitCode) ? "Sold in 0.5 steps" : "Sold in whole units"}
          {stock !== "unknown" && !soldOut
            ? ` · ${formatQuantity(product.stockMilli as number, product.unitCode)} available`
            : ""}
        </p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-1">
          <div>
            <p className="text-lg font-bold text-accent">
              {formatPaisa(product.effectivePricePaisa)}
            </p>
            <p className="text-xs text-muted">
              {product.onSale && product.salePricePaisa !== null ? (
                <>
                  <span className="line-through">{formatPaisa(product.pricePaisa)}</span>{" "}
                </>
              ) : null}
              {perUnit}
            </p>
          </div>

          <GlassButton
            size="sm"
            variant={soldOut ? "secondary" : "primary"}
            disabled={soldOut}
            aria-label={`${labels.addToCart}: ${product.name}`}
            onClick={() => onAddToCart(product)}
            className="min-w-10 px-3"
          >
            <ShoppingCart size={16} aria-hidden="true" />
            <span className="hidden sm:inline">{labels.addToCart}</span>
          </GlassButton>
        </div>
      </div>
    </GlassCard>
  );
}
