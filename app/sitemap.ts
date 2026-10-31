import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

const PUBLIC_PATHS = [
  "/",
  "/shop",
  "/products",
  "/contact",
  "/delivery",
  "/returns",
  "/privacy",
  "/terms",
  "/track",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = SITE_URL;
  if (!siteUrl) return [];

  return PUBLIC_PATHS.map((path) => ({
    url: new URL(path, siteUrl).href,
  }));
}
