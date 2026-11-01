"use client";

import Image from "next/image";
import { Heart, ShoppingCart } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { GlassButton } from "./GlassButton";
import { GlassCard } from "./GlassCard";
import { cn, formatPaisa, formatQuantity, isFractionalUnit, unitLabel } from "@/lib/utils";
import { LOW_STOCK_THRESHOLD_MILLI } from "@/lib/catalog";
import type { Product } from "@/lib/types";
import { useWishlist } from "@/lib/wishlist";
import { useState } from "react";

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
  const router = useRouter();
  const pathname = usePathname();
  const { productIds, session, ready, toggleProduct } = useWishlist();
  const [wishlistPending, setWishlistPending] = useState(false);
  const stock = stockState(product);
  const soldOut = stock === "out";
  const wishlisted = productIds.has(product.id);
  const perUnit = `per ${unitLabel(product.unitCode)}`;

  async function toggleWishlist() {
    if (!session) {
      router.push(`/sign-in?next=${encodeURIComponent(pathname || "/shop")}`);
      return;
    }
    setWishlistPending(true);
    await toggleProduct(product.id);
    setWishlistPending(false);
  }

  const stockLabel =
    stock === "out" ? labels.outOfStock : stock === "low" ? labels.lowStock : labels.inStock;
  // Tinted border/background carries the meaning; the label stays on `ink` so
  // it reads correctly in both light and dark mode.
  const stockTone =
    stock === "out"
      ? "border-red-400/45 bg-red-500/20 text-ink"
      : stock === "low"
        ? "border-amber-400/45 bg-amber-500/20 text-ink"
        : "border-emerald-400/45 bg-emerald-500/20 text-ink";

  return (
    <GlassCard
      as="article"
      interactive
      spotlight
      padding="none"
      className="group flex h-full flex-col overflow-hidden"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        {product.imagePath ? (
          <Image
            src={product.imagePath}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="photo-treat object-cover transition-transform duration-700 ease-spring group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_55%_45%,rgb(var(--accent2)/0.22),transparent_58%),linear-gradient(145deg,#1a1012,#140e10_48%,#241012)]">
            <span
              aria-hidden="true"
              className="absolute inset-0 grid place-items-center text-5xl font-semibold text-accent2/30"
            >
              {product.name.charAt(0)}
            </span>
          </div>
        )}

        <div className="photo-vignette" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0b0809]/80 to-transparent" aria-hidden="true" />

        <span className="absolute left-3 top-3">
          <span
            className={cn(
              "rounded-full border px-2.5 py-1 text-[0.6875rem] font-medium backdrop-blur-xl",
              stockTone,
              soldOut && "motion-safe:animate-pulse"
            )}
          >
            {stockLabel}
          </span>
        </span>
        <button
          type="button"
          onClick={toggleWishlist}
          aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          aria-pressed={wishlisted}
          disabled={!ready || wishlistPending}
          className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/55 text-white backdrop-blur transition-colors hover:border-accent hover:text-accent disabled:opacity-60"
        >
          <Heart size={18} aria-hidden="true" className={wishlisted ? "fill-current text-accent" : ""} />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div>
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-accent2/90">
            {product.categoryName ?? ""}
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            {product.onSale ? (
              <span className="rounded-full bg-accent px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-on-accent">
                {labels.sale}
              </span>
            ) : null}
            <h3 className="text-base font-semibold leading-snug text-ink">{product.name}</h3>
          </div>
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
            <p className="text-lg font-bold text-accent2">
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
