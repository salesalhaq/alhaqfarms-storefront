export type GlassTheme = "garnet" | "ocean" | "emerald" | "midnight" | "sunset";
export type ColorMode = "light" | "dark" | "system";

export interface BrandSettings {
  businessName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  /** Digits only, used to build wa.me links. */
  whatsapp: string;
  logoUrl: string | null;
  /** Accent shipped by settings; null means "use the glass theme accent". */
  accentColor: string | null;
  themeId: GlassTheme;
}

export const GLASS_THEMES: ReadonlyArray<{ id: GlassTheme; label: string; swatch: string }> = [
  { id: "garnet", label: "Garnet & Gold", swatch: "#a20d19" },
  { id: "emerald", label: "Emerald", swatch: "#10b981" },
  { id: "ocean", label: "Ocean", swatch: "#0ea5e9" },
  { id: "midnight", label: "Midnight", swatch: "#818cf8" },
  { id: "sunset", label: "Sunset", swatch: "#f97316" },
];

export const BRAND_SETTINGS: BrandSettings = {
  businessName: "Al Haq Farms & Meats",
  tagline: "Pure. Fresh. Perfected.",
  address: "Akora Khattak, Nowshera, KPK, Pakistan",
  phone: "+92 333 3867073",
  email: "info@alhaqfarms.com.pk",
  website: "https://www.alhaqfarms.com.pk",
  whatsapp: "923333867073",
  logoUrl: null,
  accentColor: null,
  themeId: "garnet",
};

export function whatsappLink(whatsapp: string, message?: string): string {
  const base = `https://wa.me/${whatsapp}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
