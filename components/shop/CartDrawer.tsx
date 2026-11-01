"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Trash2, ArrowRight, MessageCircle, ShieldCheck, Truck } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton, buttonStyles } from "@/components/ui/GlassButton";
import { QuantitySelector } from "@/components/shop/QuantitySelector";
import { useCart } from "@/lib/store";
import { formatPaisa, toDecimalQuantity } from "@/lib/utils";
import { BRAND_SETTINGS, whatsappLink } from "@/lib/brand";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, subtotalPaisa } = useCart();

  // Prevent scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-[70] w-full max-w-md"
          >
            <GlassCard
              variant="strong"
              padding="none"
              className="flex h-full flex-col rounded-none border-y-0 border-r-0"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-line/10 p-6">
                <div className="flex items-center gap-3">
                  <ShoppingBag size={20} className="text-accent2" />
                  <h2 className="text-lg font-bold text-ink">Your Cart</h2>
                  <span className="chip text-[10px]">
                    {items.length} {items.length === 1 ? "Item" : "Items"}
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="grid h-10 w-10 place-items-center rounded-full text-muted transition-colors hover:bg-line/10 hover:text-ink"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-6">
                {items.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="mb-4 grid h-20 w-20 place-items-center rounded-full bg-white/[0.06] text-muted">
                      <ShoppingBag size={40} />
                    </div>
                    <p className="text-base font-medium text-ink">Your cart is empty</p>
                    <p className="mt-2 text-sm text-muted">
                      Browse our shop to add fresh farm products to your cart.
                    </p>
                    <Link href="/shop" onClick={onClose} className="mt-8">
                      <GlassButton>Start Shopping</GlassButton>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <AnimatePresence initial={false}>
                      {items.map((item) => (
                        <motion.div
                          key={item.productId}
                          layout
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, x: 40, height: 0 }}
                          transition={{ duration: 0.25 }}
                          className="flex gap-4 overflow-hidden rounded-glass-sm border border-success/15 bg-success/[0.04] p-3"
                        >
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-glass-sm bg-line/5">
                          {item.imagePath ? (
                            <Image
                              src={item.imagePath}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-ink/20">
                              {item.name.charAt(0)}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-1 flex-col gap-2">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-semibold text-ink line-clamp-1">
                              {item.name}
                            </h3>
                            <button
                              onClick={() => removeItem(item.productId)}
                              className="text-muted transition-colors hover:text-red-400"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          <p className="text-xs text-muted">
                            {formatPaisa(item.pricePaisa)} / {item.unitCode}
                          </p>

                          <div className="mt-1 flex items-center justify-between gap-4">
                            <QuantitySelector
                              unitCode={item.unitCode}
                              quantityMilli={item.quantityMilli}
                              onChange={(newMilli) =>
                                updateQuantity(item.productId, newMilli - item.quantityMilli)
                              }
                              className="h-9 py-0"
                            />
                            <span className="text-sm font-bold text-accent2">
                              {formatPaisa((item.pricePaisa * item.quantityMilli) / 1000)}
                            </span>
                          </div>
                        </div>
                        </motion.div>
                    ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Footer */}
              {items.length > 0 && (
                <div className="space-y-4 border-t border-line/10 p-6">
                  <div className="glass-gold rounded-glass p-3 text-center text-xs font-medium text-accent2">
                    Free delivery on qualifying orders today
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted">Subtotal</span>
                    <span className="text-gold-gradient text-2xl font-extrabold">
                      {formatPaisa(subtotalPaisa)}
                    </span>
                  </div>

                  <p className="text-center text-[10px] text-muted">
                    Delivery charges and taxes are calculated at checkout.
                  </p>

                  <a
                    href={whatsappLink(
                      BRAND_SETTINGS.whatsapp,
                      `Hi! I would like to order: ${items
                        .map((item) => `${toDecimalQuantity(item.quantityMilli)} ${item.unitCode} ${item.name}`)
                        .join(", ")}. Subtotal ${formatPaisa(subtotalPaisa)}.`
                    )}
                    target="_blank"
                    rel="noreferrer"
                    onClick={onClose}
                    className={buttonStyles("whatsapp", "lg", "w-full")}
                  >
                    <MessageCircle size={18} aria-hidden="true" />
                    Order on WhatsApp
                  </a>

                  <Link href="/checkout" onClick={onClose}>
                    <GlassButton variant="secondary" className="w-full" size="lg">
                      Checkout
                      <ArrowRight size={18} className="ml-2" />
                    </GlassButton>
                  </Link>

                  <ul className="flex items-center justify-center gap-4 pt-1 text-[11px] text-muted">
                    <li className="flex items-center gap-1.5">
                      <Truck size={13} aria-hidden="true" className="text-accent2" />
                      Fast delivery
                    </li>
                    <li className="flex items-center gap-1.5">
                      <ShieldCheck size={13} aria-hidden="true" className="text-accent2" />
                      100% Halal
                    </li>
                  </ul>
                </div>
              )}
            </GlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}