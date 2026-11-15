import { brandMonogramSvg, DEFAULT_BRAND_NAME } from "@/lib/branding";
import { getPublicBusinessSettings } from "@/lib/server/public-business-settings";

export const dynamic = "force-dynamic";

const LOGO_PATTERN = /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/]+={0,2})$/i;

/**
 * Serves the shop logo saved in branding settings as a real image URL.
 *
 * Browsers and the web manifest need a URL for favicons and installed app
 * icons; branding is stored as a data URL. When no logo has been uploaded an
 * initials mark is generated from the current business name and brand color.
 */
export async function GET() {
  const settings = await getPublicBusinessSettings();
  const match = settings.logoDataUrl.match(LOGO_PATTERN);
  const cacheControl = "public, max-age=60, stale-while-revalidate=300";

  if (match) {
    const [, mimeType, payload] = match;
    const bytes = Buffer.from(payload, "base64");
    return new Response(bytes, {
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": cacheControl,
      },
    });
  }

  return new Response(
    brandMonogramSvg(settings.businessName || DEFAULT_BRAND_NAME, settings.brandColor),
    {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": cacheControl,
      },
    },
  );
}
