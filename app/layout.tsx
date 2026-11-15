import type { CSSProperties } from "react";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BrandProvider } from "@/components/BrandProvider";
import { PublicBusinessSettingsProvider } from "@/components/PublicBusinessSettingsProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { CartProvider } from "@/lib/store";
import { WishlistProvider } from "@/lib/wishlist";
import { THEME_INIT_SCRIPT } from "@/components/theme/theme-init";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import { hexToRgbTriple, readableOnBrand } from "@/lib/brand";
import { getBrandSettings } from "@/lib/brand-server";
import { DEFAULT_BRAND_COLOR, DEFAULT_BRAND_NAME, DEFAULT_BRAND_TAGLINE } from "@/lib/branding";
import { getPublicBusinessSettings } from "@/lib/server/public-business-settings";

export const dynamic = "force-dynamic";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicBusinessSettings();
  const businessName = settings.businessName || DEFAULT_BRAND_NAME;
  const description = settings.businessTagline || DEFAULT_BRAND_TAGLINE;

  return {
    title: {
      default: businessName,
      template: `%s · ${businessName}`,
    },
    applicationName: businessName,
    description,
    manifest: "/manifest.webmanifest",
    icons: {
      icon: [{ url: "/api/public/branding/icon", sizes: "any" }],
      shortcut: "/api/public/branding/icon",
      apple: [{ url: "/api/public/branding/icon?size=180", sizes: "180x180" }],
    },
    appleWebApp: {
      capable: true,
      title: businessName,
      statusBarStyle: "default",
    },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const settings = await getPublicBusinessSettings();
  return {
    themeColor: settings.brandColor || DEFAULT_BRAND_COLOR,
    colorScheme: "light",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const brand = await getBrandSettings();
  // The saved brand colour overrides the palette accent so every primary
  // action, glass tint and ambient glow matches the shop branding.
  const brandTokens = {
    "--accent": hexToRgbTriple(brand.brandColor),
    "--glass-fill": hexToRgbTriple(brand.brandColor),
    "--aurora-1": hexToRgbTriple(brand.brandColor),
    "--on-accent": readableOnBrand(brand.brandColor),
  } as CSSProperties;

  return (
    <html
      lang="en"
      className={inter.variable}
      style={brandTokens}
      suppressHydrationWarning
    >
      <head>
        {/* Applies the saved mode, glass theme and effects level before paint. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen">
        <PublicBusinessSettingsProvider>
          <BrandProvider brand={brand}>
            <ThemeProvider>
              <CartProvider>
                <WishlistProvider>
                  <AuroraBackground />
                  <Navbar brand={brand} />
                  <div className="pt-28 sm:pt-32">{children}</div>
                  <Footer brand={brand} />
                </WishlistProvider>
              </CartProvider>
            </ThemeProvider>
          </BrandProvider>
        </PublicBusinessSettingsProvider>
      </body>
    </html>
  );
}
