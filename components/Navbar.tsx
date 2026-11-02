"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Clock,
  MapPin,
  Menu,
  Phone,
  ShieldCheck,
  ShoppingCart,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import { BrandMark } from "@/components/ui/BrandMark";
import { ThemeMenu } from "@/components/theme/ThemeMenu";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { buttonStyles } from "@/components/ui/GlassButton";
import { cn, formatPaisa } from "@/lib/utils";
import { useCart } from "@/lib/store";
import { navigation } from "@/content/site";
import { BRAND_SETTINGS, type BrandSettings } from "@/lib/brand";

interface NavbarProps {
  brand: BrandSettings;
}

const INFO_ITEMS = [
  { Icon: Phone, label: BRAND_SETTINGS.phone },
  { Icon: MapPin, label: BRAND_SETTINGS.address },
  { Icon: ShieldCheck, label: "100% Halal Certified" },
  { Icon: Clock, label: "9am – 10pm Daily" },
  { Icon: Truck, label: "Same-day delivery" },
];

export function Navbar({ brand }: NavbarProps) {
  const pathname = usePathname();
  const { items, subtotalPaisa } = useCart();
  const [open, setOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuAreaRef = useRef<HTMLDivElement>(null);

  const cartItemsCount = items.length;
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!menuAreaRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="glass-line hidden border-x-0 border-t-0 py-1.5 lg:block">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 text-[0.6875rem] text-muted">
          <div className="flex items-center gap-5">
            {INFO_ITEMS.map((item) => (
              <span key={item.label} className="flex items-center gap-1.5">
                <item.Icon size={13} aria-hidden="true" className="text-accent2" />
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div ref={menuAreaRef} className="mx-auto w-full max-w-6xl px-4">
        <nav
          aria-label="Primary"
          className={cn(
            "flex items-center gap-2 rounded-full px-3 py-2 transition-all duration-500 ease-spring sm:px-4",
            scrolled ? "glass-strong mt-3 shadow-[0_12px_40px_rgb(0_0_0/0.5)]" : "glass mt-3"
          )}
        >
          <Link href="/" className="flex items-center gap-2.5 rounded-full pr-2" aria-label={brand.businessName}>
            <BrandMark brand={brand} size={38} />
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-ink">{brand.businessName}</span>
              <span className="hidden text-[0.6875rem] text-muted sm:block">{brand.tagline}</span>
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-1">
            <div className="hidden items-center gap-1 md:flex">
              {navigation.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative rounded-full px-3.5 py-2 text-sm transition-colors",
                      active ? "text-ink" : "text-muted hover:text-ink"
                    )}
                  >
                    {item.label}
                    {active ? (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-accent2"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    ) : null}
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-1 md:ml-2">
              <div className="hidden items-center gap-1 md:flex">
                <ThemeMenu />
                <Link
                  href="/account"
                  aria-label="My account"
                  className={buttonStyles("ghost", "sm", "w-10 px-0")}
                >
                  <UserRound size={18} aria-hidden="true" />
                </Link>
                <button
                  type="button"
                  aria-label="Cart"
                  onClick={() => setCartOpen(true)}
                  className={buttonStyles("secondary", "sm", "relative w-10 px-0")}
                >
                  <ShoppingCart size={18} aria-hidden="true" />
                  {cartItemsCount > 0 && (
                    <motion.span
                      key={cartItemsCount}
                      initial={{ scale: 0.4 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 520, damping: 16 }}
                      className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-on-accent shadow-[0_0_12px_rgb(193_18_31/0.7)]"
                    >
                      {cartItemsCount}
                    </motion.span>
                  )}
                </button>
              </div>
              <Link
                href="/account"
                aria-label="My account"
                className={buttonStyles("ghost", "sm", "w-10 px-0 md:hidden")}
              >
                <UserRound size={18} aria-hidden="true" />
              </Link>
              <button
                type="button"
                aria-expanded={open}
                aria-label={open ? "Close menu" : "Open menu"}
                onClick={() => setOpen((value) => !value)}
                className={buttonStyles("ghost", "sm", "w-10 px-0 md:hidden")}
              >
                {open ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
              </button>
            </div>
          </div>
        </nav>

        {open ? (
          <div className="glass-strong mt-2 rounded-glass p-2 md:hidden">
            <div className="flex items-center gap-2 border-b border-line/10 px-2 pb-2">
              <ThemeMenu />
              <button
                type="button"
                aria-label="Cart"
                onClick={() => {
                  setOpen(false);
                  setCartOpen(true);
                }}
                className={buttonStyles("secondary", "sm", "relative w-10 px-0")}
              >
                <ShoppingCart size={18} aria-hidden="true" />
                {cartItemsCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-on-accent">
                    {cartItemsCount}
                  </span>
                )}
              </button>
            </div>
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "block rounded-glass-sm px-4 py-3 text-sm transition-colors",
                  isActive(item.href)
                    ? "bg-accent/20 text-ink"
                    : "text-muted hover:bg-line/[0.06] hover:text-ink"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
      <AnimatePresence>
        {cartItemsCount > 0 && (
          <motion.button
            key="floating-cart"
            type="button"
            aria-label={`Open cart, ${cartItemsCount} ${
              cartItemsCount === 1 ? "item" : "items"
            }, subtotal ${formatPaisa(subtotalPaisa)}`}
            onClick={() => setCartOpen(true)}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            whileTap={{ scale: 0.97 }}
            className="fixed right-4 z-[55] flex min-h-14 items-center gap-3 rounded-full border border-accent2/35 bg-surface/95 px-4 text-left text-ink shadow-[0_12px_36px_rgb(0_0_0/0.4)] backdrop-blur-xl transition-colors hover:border-accent2/60 hover:bg-surface sm:right-6"
            style={{ bottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
          >
            <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-on-accent">
              <ShoppingCart size={19} aria-hidden="true" />
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent2 px-1 text-[10px] font-bold text-canvas">
                {cartItemsCount}
              </span>
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-xs font-medium text-muted">
                View cart · {cartItemsCount} {cartItemsCount === 1 ? "item" : "items"}
              </span>
              <span className="text-sm font-bold">{formatPaisa(subtotalPaisa)}</span>
            </span>
            <ArrowRight size={17} aria-hidden="true" className="ml-1 shrink-0 text-accent2" />
          </motion.button>
        )}
      </AnimatePresence>
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </header>
  );
}
