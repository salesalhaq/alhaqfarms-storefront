"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { formatPaisa } from "@/lib/utils";
import { useWishlist } from "@/lib/wishlist";

interface WishlistItem {
  productId: string;
  name: string;
  unitCode: string;
  pricePaisa: number;
  onSale: boolean;
  salePricePaisa: number | null;
}

interface WishlistResponse {
  items: WishlistItem[];
}

export function CustomerWishlist() {
  const { session, ready, productIds, toggleProduct } = useWishlist();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      if (!ready) return;
      if (!session) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/account/wishlist", {
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: "no-store",
        });
        const result: unknown = await response.json();
        if (!response.ok) {
          const message = typeof result === "object" && result !== null && "error" in result &&
            typeof result.error === "string" ? result.error : "Could not load your wishlist.";
          throw new Error(message);
        }
        if (typeof result !== "object" || result === null || !("items" in result) || !Array.isArray(result.items)) {
          throw new Error("The wishlist service returned an invalid response.");
        }
        if (active) setItems((result as WishlistResponse).items);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load your wishlist.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => { active = false; };
  }, [ready, session]);

  async function removeItem(productId: string) {
    setRemoving(productId);
    const removed = await toggleProduct(productId);
    if (!removed) setError("Could not remove this product. Please try again.");
    setRemoving(null);
  }

  const visibleItems = items.filter((item) => productIds.has(item.productId));

  return (
    <GlassCard as="section" padding="lg">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent2">Saved products</p>
          <h2 className="mt-1 text-2xl font-semibold text-ink">My wishlist</h2>
        </div>
        <Link href="/shop" className="text-sm font-semibold text-accent2 hover:underline">Browse the shop</Link>
      </div>

      {loading && <p className="mt-6 text-sm text-muted" role="status">Loading your wishlist…</p>}
      {error && <p className="mt-6 rounded-glass-sm border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200" role="alert">{error}</p>}
      {!loading && !error && !visibleItems.length && (
        <p className="mt-6 text-sm text-muted">Your wishlist is empty. Tap the heart on a product to save it here.</p>
      )}
      {!loading && visibleItems.length > 0 && (
        <ul className="mt-6 divide-y divide-line/10">
          {visibleItems.map((item) => {
            const price = item.onSale && item.salePricePaisa !== null ? item.salePricePaisa : item.pricePaisa;
            return (
              <li key={item.productId} className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <Link href={`/shop/${encodeURIComponent(item.productId)}`} className="font-semibold text-ink hover:text-accent2">
                    {item.name}
                  </Link>
                  <p className="mt-1 text-sm text-muted">
                    {formatPaisa(price)} / {item.unitCode}
                    {item.onSale && <span className="ml-2 text-accent2">On sale</span>}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Link href={`/shop/${encodeURIComponent(item.productId)}`} className="text-sm text-accent2 hover:underline">View product</Link>
                  <button type="button" onClick={() => void removeItem(item.productId)} disabled={removing === item.productId}
                    className="text-sm text-muted underline underline-offset-4 hover:text-ink disabled:opacity-50">
                    {removing === item.productId ? "Removing…" : "Remove"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </GlassCard>
  );
}
