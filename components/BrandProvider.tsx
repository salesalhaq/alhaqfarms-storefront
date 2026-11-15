"use client";

import { createContext, useContext, type ReactNode } from "react";

import { BRAND_SETTINGS, type BrandSettings } from "@/lib/brand";

const BrandContext = createContext<BrandSettings>(BRAND_SETTINGS);

/**
 * Shares the branding loaded from Settings → Branding & shop with client
 * components. The root layout reads it on the server so pages never ship a
 * hardcoded shop name.
 */
export function BrandProvider({
  brand,
  children,
}: {
  brand: BrandSettings;
  children: ReactNode;
}) {
  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
}

export function useBrand(): BrandSettings {
  return useContext(BrandContext);
}
