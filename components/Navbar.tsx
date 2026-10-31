"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, ShoppingCart, X } from "lucide-react";
import { BrandMark } from "@/components/ui/BrandMark";
import { ThemeMenu } from "@/components/theme/ThemeMenu";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { buttonStyles } from "@/components/ui/GlassButton";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/store";
import { navigation } from "@/content/site";
import type { BrandSettings } from "@/lib/brand";

interface NavbarProps {
  brand: BrandSettings;
}

export function Navbar({ brand }: NavbarProps) {
  const pathname = usePathname();
  const { items } = useCart();
  const [open, setOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const cartItemsCount = items.length;
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto w-full max-w-6xl px-4 pt-2">
        <nav
          aria-label="Primary"
          className="glass flex items-center gap-2 rounded-glass px-3 py-2 sm:px-4"
        >
          <Link href="/" className="flex items-center gap-2.5 rounded-full pr-2" aria-label={brand.businessName}>
            <BrandMark brand={brand} size={34} />
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-ink">{brand.businessName}</span>
              <span className="hidden text-[0.6875rem] text-muted sm:block">{brand.tagline}</span>
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-1">
            <div className="hidden items-center gap-1 md:flex">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "rounded-full px-3.5 py-2 text-sm transition-colors",
                    isActive(item.href)
                      ? "bg-accent/15 text-ink"
                      : "text-muted hover:bg-line/[0.06] hover:text-ink"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-1 md:ml-2">
              <ThemeMenu />
              <Link
                href="/shop"
                aria-label="Search products"
                className={buttonStyles("ghost", "sm", "w-10 px-0")}
              >
                <Search size={18} aria-hidden="true" />
              </Link>
              <button
                type="button"
                aria-label="Cart"
                onClick={() => setCartOpen(true)}
                className={buttonStyles("secondary", "sm", "relative w-10 px-0")}
              >
                <ShoppingCart size={18} aria-hidden="true" />
                {cartItemsCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-on-accent">
                    {cartItemsCount}
                  </span>
                )}
              </button>
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
          <div className="glass mt-2 rounded-glass p-2 md:hidden">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "block rounded-glass-sm px-4 py-3 text-sm transition-colors",
                  isActive(item.href)
                    ? "bg-accent/15 text-ink"
                    : "text-muted hover:bg-line/[0.06] hover:text-ink"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </header>
  );
}
