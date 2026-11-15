import { brandMonogramSvg } from "@/lib/brand";
import { getBrandIconSource } from "@/lib/brand-server";

export const dynamic = "force-dynamic";

const LOGO_PATTERN = /^data:image\/(png|jpeg|webp|gif);base64,([A-Za-z0-9+/]+={0,2})$/i;

/**
 * Serves the logo saved in Settings → Branding & shop as a real image URL for
 * the favicon, Apple touch icon, installable app manifest and header marks.
 * Without an uploaded logo it draws an initials monogram from the current
 * business name and brand colour, so a renamed shop never shows an old mark.
 */
export async function GET() {
  const { businessName, brandColor, logoDataUrl } = await getBrandIconSource();
  const cacheControl = "public, max-age=60, stale-while-revalidate=300";
  const match = logoDataUrl.match(LOGO_PATTERN);

  if (match) {
    const [, format, payload] = match;
    const bytes = Buffer.from(payload, "base64");
    return new Response(bytes, {
      headers: {
        "Content-Type": `image/${format === "jpeg" ? "jpeg" : format}`,
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": cacheControl,
      },
    });
  }

  return new Response(brandMonogramSvg(businessName, brandColor), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": cacheControl,
    },
  });
}
