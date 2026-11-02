export type GlassTheme =
  | "palette-13-first"
  | "palette-13-last"
  | "palette-14-first"
  | "palette-14-last"
  | "palette-15-first"
  | "palette-15-last"
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
  { id: "palette-13-first", label: "Row 13 · First column", swatch: "#A867A1", colors: ["#4D3A4D", "#A867A1", "#D69BC9", "#E3D3D3"] },
  { id: "palette-13-last", label: "Row 13 · Last column", swatch: "#FED517", colors: ["#FED517", "#369946", "#06365A", "#011F41"] },
  { id: "palette-14-first", label: "Row 14 · First column", swatch: "#FCD033", colors: ["#374667", "#1BB1D4", "#FCD033", "#F73558"] },
  { id: "palette-14-last", label: "Row 14 · Last column", swatch: "#158CA2", colors: ["#FFF5F4", "#B1D438", "#158CA2", "#000000"] },
  { id: "palette-15-first", label: "Row 15 · First column", swatch: "#4C546B", colors: ["#182037", "#4C546B", "#BE3721", "#D8D8D8"] },
  { id: "palette-15-last", label: "Row 15 · Last column", swatch: "#089B95", colors: ["#9A64C4", "#089B95", "#14CEA5", "#F0E6E5"] },
  { id: "palette-16-first", label: "Row 16 · First column", swatch: "#F66A2C", colors: ["#E4DFD9", "#80716A", "#4E433D", "#F66A2C"] },
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
  themeId: "palette-15-first",
};

export function whatsappLink(whatsapp: string, message?: string): string {
  const base = `https://wa.me/${whatsapp}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
