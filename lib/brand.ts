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
  logoUrl: string | null;
  /** Accent shipped by settings; null means "use the glass theme accent". */
  accentColor: string | null;
  themeId: GlassTheme;
}

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

export const BRAND_SETTINGS: BrandSettings = {
  businessName: "Al Haq Farms & Meats",
  tagline: "Pure. Fresh. Perfected.",
  address: "Akora Khattak, Nowshera, KPK, Pakistan",
  phone: "+92 333 3867073",
  email: "info@alhaqfarms.com.pk",
  website: "https://www.alhaqfarms.com.pk",
  whatsapp: "923333867073",
  logoUrl: "/assets/brand/alhaq-farms-icon.png",
  accentColor: null,
  themeId: "palette-14-last",
};

export function whatsappLink(whatsapp: string, message?: string): string {
  const base = `https://wa.me/${whatsapp}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
