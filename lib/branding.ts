export const DEFAULT_BRAND_NAME = "Al Haq Farms & Meats";
export const DEFAULT_BRAND_TAGLINE = "Pure.Fresh.Perfected.";

export const DEFAULT_BRAND_MARK = "AH";
export const DEFAULT_BRAND_COLOR = "#1b7748";

export const PRODUCT_NAME = "Al Haq Farms & Meats Management";

export function isBrandColor(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value);
}

/** First letters of the first two words, e.g. "Al Haq Farms" → "AH". */
export function brandInitials(name: string): string {
  const words = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return DEFAULT_BRAND_MARK;
  return words.slice(0, 2).map((word) => Array.from(word)[0]?.toUpperCase() || "").join("") || DEFAULT_BRAND_MARK;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * Generated brand mark used when no logo has been uploaded, so a renamed shop
 * never keeps showing the old logo.
 */
export function brandMonogramSvg(name: string, color = DEFAULT_BRAND_COLOR): string {
  const initials = escapeXml(brandInitials(name));
  const background = isBrandColor(color) ? color : DEFAULT_BRAND_COLOR;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="${background}"/><text x="256" y="322" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="220" font-weight="700" fill="#ffffff">${initials}</text></svg>`;
}

export function brandMonogramDataUrl(name: string, color = DEFAULT_BRAND_COLOR): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(brandMonogramSvg(name, color))}`;
}
