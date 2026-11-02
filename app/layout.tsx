import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { CartProvider } from "@/lib/store";
import { WishlistProvider } from "@/lib/wishlist";
import { THEME_INIT_SCRIPT } from "@/components/theme/theme-init";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import { BRAND_SETTINGS } from "@/lib/brand";
import { content } from "@/content/site";
import { SITE_URL } from "@/lib/site-url";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export function generateMetadata(): Metadata {
  const defaultTitle = "Al-Haq Farms - Fresh, Organic & Sustainable";
  return {
    ...(SITE_URL ? { metadataBase: SITE_URL } : {}),
    title: { default: defaultTitle, template: `%s · ${BRAND_SETTINGS.businessName}` },
    description: content.home.hero.text,
    applicationName: BRAND_SETTINGS.businessName,
    ...(SITE_URL ? { alternates: { canonical: "/" } } : {}),
    openGraph: {
      title: defaultTitle,
      description: content.home.hero.text,
      siteName: BRAND_SETTINGS.businessName,
      type: "website",
      images: ["/assets/brand/alhaq-farms-logo.jpg"],
      ...(SITE_URL ? { url: SITE_URL.href } : {}),
    },
    twitter: {
      card: "summary",
      title: defaultTitle,
      description: content.home.hero.text,
    },
    icons: {
      icon: "/assets/brand/alhaq-farms-icon.png",
      apple: "/assets/brand/alhaq-farms-icon.png",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#0B0809",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Applies the saved mode, glass theme and effects level before paint. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen">
        <ThemeProvider>
          <CartProvider>
            <WishlistProvider>
              <AuroraBackground />
              <Navbar brand={BRAND_SETTINGS} />
              <div className="pt-28 sm:pt-32">{children}</div>
              <Footer brand={BRAND_SETTINGS} />
            </WishlistProvider>
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
