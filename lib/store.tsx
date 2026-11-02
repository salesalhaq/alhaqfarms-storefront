"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { CartItem, Product } from "./types";
import { quantityStep } from "./utils";

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantityMilli?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, deltaMilli: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotalPaisa: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = "sf:cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load only this tab's cart and discard any cart saved by the previous persistent behavior.
  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse cart from storage", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Keep the cart for this tab session without carrying it across browser restarts.
  useEffect(() => {
    if (isLoaded) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const addItem = (product: Product, quantityMilli?: number) => {
    const step = quantityMilli ?? quantityStep(product.unitCode) * 1000;

    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id
            ? { ...i, quantityMilli: i.quantityMilli + step }
            : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          unitCode: product.unitCode,
          pricePaisa: product.effectivePricePaisa,
          quantityMilli: step,
          imagePath: product.imagePath,
        },
      ];
    });
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const updateQuantity = (productId: string, deltaMilli: number) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.productId === productId) {
          const newQty = Math.max(0, i.quantityMilli + deltaMilli);
          return { ...i, quantityMilli: newQty };
        }
        return i;
      }).filter((i) => i.quantityMilli > 0)
    );
  };

  const clearCart = () => setItems([]);

  const itemCount = items.reduce((acc, i) => acc + (i.quantityMilli / 1000), 0);
  const subtotalPaisa = items.reduce(
    (acc, i) => acc + (i.pricePaisa * i.quantityMilli) / 1000,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        subtotalPaisa,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
