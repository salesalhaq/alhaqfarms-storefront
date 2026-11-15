import "server-only";

import { cache } from "react";

import {
  BRAND_SETTINGS,
  DEFAULT_BRAND_COLOR,
  DEFAULT_BRAND_NAME,
  isBrandColor,
  type BrandSettings,
} from "@/lib/brand";
import { getSupabase } from "@/lib/supabase";

/** Columns the workspace writes into `public.web_business_settings.settings`. */
interface StoredBusinessSettings {
  businessName?: unknown;
  businessTagline?: unknown;
  businessAddress?: unknown;
  businessPhone?: unknown;
  businessEmail?: unknown;
  businessWebsite?: unknown;
  logoDataUrl?: unknown;
  brandColor?: unknown;
}

export interface BrandIconSource {
  businessName: string;
  brandColor: string;
  logoDataUrl: string;
}

function text(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

/**
 * Digits only, in wa.me format. Local numbers such as 0333… become 92333… so
 * the WhatsApp button follows whatever phone number is saved in settings.
 */
function whatsappDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return `92${digits.slice(1)}`;
  return digits;
}

async function readStoredSettings(): Promise<StoredBusinessSettings | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("web_business_settings")
      .select("settings")
      .eq("id", "shop")
      .maybeSingle();

    if (error) {
      console.warn("Could not load storefront branding settings.", error.message);
      return null;
    }

    const settings = data?.settings;
    return settings && typeof settings === "object"
      ? (settings as StoredBusinessSettings)
      : null;
  } catch (error) {
    console.warn(
      "Could not load storefront branding settings.",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

/**
 * Branding shown across the storefront: name, tagline, contact details, logo
 * and brand colour. Reads the same row that Settings → Branding & shop writes in
 * the management app, and falls back to the shipped defaults when the database
 * is unreachable so the shop always renders.
 */
export const getBrandSettings = cache(async (): Promise<BrandSettings> => {
  const stored = await readStoredSettings();
  if (!stored) return BRAND_SETTINGS;

  const businessName = text(stored.businessName, 200) || DEFAULT_BRAND_NAME;
  const phone = text(stored.businessPhone, 40);
  const brandColor = text(stored.brandColor, 7);
  const logoDataUrl = text(stored.logoDataUrl, 2_100_000);

  return {
    businessName,
    tagline: text(stored.businessTagline, 200) || BRAND_SETTINGS.tagline,
    address: text(stored.businessAddress, 400),
    phone,
    email: text(stored.businessEmail, 254),
    website: text(stored.businessWebsite, 500),
    whatsapp: whatsappDigits(phone) || BRAND_SETTINGS.whatsapp,
    logoUrl: logoDataUrl ? "/api/brand/icon" : null,
    brandColor: isBrandColor(brandColor) ? brandColor : DEFAULT_BRAND_COLOR,
    themeId: BRAND_SETTINGS.themeId,
  };
});

/** Raw logo bytes plus the fallbacks needed to draw a monogram. */
export const getBrandIconSource = cache(async (): Promise<BrandIconSource> => {
  const stored = await readStoredSettings();
  const brandColor = text(stored?.brandColor, 7);

  return {
    businessName: text(stored?.businessName, 200) || DEFAULT_BRAND_NAME,
    brandColor: isBrandColor(brandColor) ? brandColor : DEFAULT_BRAND_COLOR,
    logoDataUrl: text(stored?.logoDataUrl, 2_100_000),
  };
});
