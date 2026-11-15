import type { MetadataRoute } from "next";

import { getBrandSettings } from "@/lib/brand-server";

export const dynamic = "force-dynamic";

function shortName(businessName: string): string {
  const words = businessName.trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).join(" ") || businessName;
}

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const brand = await getBrandSettings();

  return {
    name: brand.businessName,
    short_name: shortName(brand.businessName),
    description: `${brand.tagline} Shop farm-fresh products from ${brand.businessName}.`,
    start_url: "/",
    display: "standalone",
    background_color: "#faf7f3",
    theme_color: brand.brandColor,
    icons: [
      {
        src: "/api/brand/icon?size=192",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/api/brand/icon?size=512",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
