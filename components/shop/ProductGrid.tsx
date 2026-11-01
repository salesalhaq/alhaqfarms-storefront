"use client";

import { useCallback, useEffect, useState } from "react";
import { ProductCard } from "@/components/ui/ProductCard";
import { Reveal } from "@/components/ui/Reveal";
import { Toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/store";
import type { Product } from "@/lib/types";

interface ProductGridProps {
  products: Product[];
  labels: {
    sale: string;
    inStock: string;
    outOfStock: string;
    lowStock: string;
    addToCart: string;
  };
  columnsClassName?: string;
}

export function ProductGrid({
  products,
  labels,
  columnsClassName,
}: ProductGridProps) {
  const { addItem } = useCart();
  const [notice, setNotice] = useState<string | null>(null);

  const handleAddToCart = useCallback(
    (product: Product) => {
      addItem(product);
      setNotice(`Added ${product.name} to cart`);
    },
    [addItem]
  );

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 2800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  return (
    <>
      <div
        className={cn(
          "grid gap-5 sm:grid-cols-2 lg:grid-cols-4",
          columnsClassName
        )}
      >
        {products.map((product, index) => (
          <Reveal key={product.id} delay={index * 80} className="h-full">
            <ProductCard
              product={product}
              labels={labels}
              onAddToCart={handleAddToCart}
            />
          </Reveal>
        ))}
      </div>
      <Toast message={notice} onDismiss={() => setNotice(null)} />
    </>
  );
}
