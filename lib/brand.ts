export type GlassTheme =
  | "palette-13-first"
  | "palette-13-last"
  | "palette-14-last"
  | "palette-15-first"
  | "palette-15-second"
  | "palette-16-first"
  | "palette-16-last";
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
  /** Logo served from the branding settings, or null to draw the monogram. */
  logoUrl: string | null;
  /** Brand colour saved in the workspace branding settings. */
  brandColor: string;
  themeId: GlassTheme;
}

export const DEFAULT_BRAND_COLOR = "#1b7748";
export const DEFAULT_BRAND_NAME = "Al Haq Farms & Meats";

export const GLASS_THEMES: ReadonlyArray<{
  id: GlassTheme;
  label: string;
  swatch: string;
  colors: readonly [string, string, string, string];
}> = [
  { id: "palette-13-first", label: "Row 13 · First column", swatch: "#B85CA8", colors: ["#4D3A4D", "#B85CA8", "#D49EC2", "#EBD8DA"] },
  { id: "palette-13-last", label: "Row 13 · Last column", swatch: "#0DA678", colors: ["#FED519", "#0DA678", "#073358", "#011E3E"] },
  { id: "palette-14-last", label: "Row 14 · Last column", swatch: "#B1D438", colors: ["#FFF5F4", "#B1D438", "#158CA2", "#000000"] },
  { id: "palette-15-first", label: "Row 15 · First column", swatch: "#4C546B", colors: ["#1A263E", "#4C546B", "#C2402D", "#D8D8D8"] },
  { id: "palette-15-second", label: "Row 15 · Second column", swatch: "#6AD381", colors: ["#FAFFA3", "#C5E874", "#6AD381", "#063835"] },
  { id: "palette-16-first", label: "Row 16 · First column", swatch: "#80716A", colors: ["#E4DFD9", "#80716A", "#4E433D", "#4E433D"] },
  { id: "palette-16-last", label: "Row 16 · Last column", swatch: "#43785E", colors: ["#3F3F3F", "#43785E", "#B5CC98", "#F7F7BB"] },
];

/**
 * Shipped defaults. The live values come from the shared branding settings in
 * Supabase (`getBrandSettings()`); this object is only the fallback used before
 * the database is configured or when a read fails.
 */
export const BRAND_SETTINGS: BrandSettings = {
  businessName: DEFAULT_BRAND_NAME,
  tagline: "Pure. Fresh. Perfected.",
  address: "Akora Khattak, Nowshera, KPK, Pakistan",
  phone: "+92 333 3867073",
  email: "info@alhaqfarms.com.pk",
  website: "https://www.alhaqfarms.com.pk",
  whatsapp: "923333867073",
  logoUrl: "/assets/brand/alhaq-farms-icon.png",
  brandColor: DEFAULT_BRAND_COLOR,
  themeId: "palette-14-last",
};

export function whatsappLink(whatsapp: string, message?: string): string {
  const base = `https://wa.me/${whatsapp}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function isBrandColor(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value);
}

/** First letters of the first two words, e.g. "Al Haq Farms" → "AH". */
export function brandInitials(name: string): string {
  const words = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "AH";
  return (
    words
      .slice(0, 2)
      .map((word) => Array.from(word)[0]?.toUpperCase() || "")
      .join("") || "AH"
  );
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Generated mark used when no logo has been uploaded. */
export function brandMonogramSvg(name: string, color = DEFAULT_BRAND_COLOR): string {
  const initials = escapeXml(brandInitials(name));
  const background = isBrandColor(color) ? color : DEFAULT_BRAND_COLOR;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="${background}"/><text x="256" y="322" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="220" font-weight="700" fill="#ffffff">${initials}</text></svg>`;
}

/** Space separated RGB triple, the format used by the CSS design tokens. */
export function hexToRgbTriple(hex: string): string {
  const value = isBrandColor(hex) ? hex.slice(1) : DEFAULT_BRAND_COLOR.slice(1);
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return `${red} ${green} ${blue}`;
}

/** Picks white or near-black text for something drawn on the brand colour. */
export function readableOnBrand(hex: string): string {
  const value = isBrandColor(hex) ? hex.slice(1) : DEFAULT_BRAND_COLOR.slice(1);
  const [red, green, blue] = [0, 2, 4].map((offset) =>
    Number.parseInt(value.slice(offset, offset + 2), 16) / 255
  );
  const channel = (component: number) =>
    component <= 0.03928 ? component / 12.92 : ((component + 0.055) / 1.055) ** 2.4;
  const luminance = 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue);
  return luminance > 0.55 ? "17 24 20" : "255 255 255";
}
