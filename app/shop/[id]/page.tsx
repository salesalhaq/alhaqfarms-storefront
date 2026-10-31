import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogPreviewNotice } from "@/components/ui/CatalogPreviewNotice";
import { getCatalogSnapshot } from "@/lib/catalog";
import { ProductDetailClient } from "@/components/shop/ProductDetailClient";
import { content } from "@/content/site";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ branch?: string }>;
}

export async function generateMetadata({ params, searchParams }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const { branch } = await searchParams;
  const catalog = await getCatalogSnapshot(branch || undefined);
  const product = catalog.products.find((item) => item.id === id);

  if (!product) return { title: "Product Not Found" };

  return {
    title: product.name,
    description: product.description || content.home.hero.text,
    openGraph: {
      title: product.name,
      description: product.description || content.home.hero.text,
      type: "website",
    },
  };
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { id } = await params;
  const { branch } = await searchParams;
  const catalog = await getCatalogSnapshot(branch || undefined);
  const product = catalog.products.find((item) => item.id === id);

  if (!product) notFound();

  const relatedProducts = catalog.products
    .filter((item) => item.id !== product.id && item.categoryId === product.categoryId)
    .slice(0, 4);

  return (
    <main className="pt-4 sm:pt-8">
      {catalog.isSample && <div className="px-4"><CatalogPreviewNotice /></div>}
      <ProductDetailClient product={product} relatedProducts={relatedProducts} />
      
      {/* JSON-LD Product Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "Product",
            name: product.name,
            image: product.imagePath ? [product.imagePath] : [],
            description: product.description,
            sku: product.sku,
            offers: {
              "@type": "Offer",
              url: `https://storefront.example.com/shop/${product.id}`,
              priceCurrency: "PKR",
              price: product.effectivePricePaisa / 100,
              availability: product.stockMilli && product.stockMilli > 0 
                ? "https://schema.org/InStock" 
                : "https://schema.org/OutOfStock",
            },
          }),
        }}
      />
    </main>
  );
}
