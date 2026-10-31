import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { buttonStyles } from "@/components/ui/GlassButton";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CatalogPreviewNotice } from "@/components/ui/CatalogPreviewNotice";
import { Reveal } from "@/components/ui/Reveal";
import { content } from "@/content/site";
import { getCatalogSnapshot } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: content.productsPage.title,
  description: content.productsPage.intro,
};

export default async function ProductsPage() {
  const catalog = await getCatalogSnapshot();
  const groups = catalog.categories.map((category) => ({
    category,
    items: catalog.products.filter((product) => product.categoryId === category.id),
  }));

  return (
    <main className="px-4 pb-20 pt-4">
      {catalog.isSample && <CatalogPreviewNotice />}
      <div className="mx-auto w-full max-w-6xl">
        <SectionHeading
          eyebrow="Catalogue"
          title={content.productsPage.title}
          subtext={content.productsPage.intro}
          align="left"
        />

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/shop" className={buttonStyles("primary", "md")}>
            {content.productsPage.browseCta}
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
          <Link href="/" className={buttonStyles("secondary", "md")}>
            <ArrowLeft size={16} aria-hidden="true" />
            {content.productsPage.backCta}
          </Link>
        </div>

        <section className="mt-16">
          <h2 className="text-2xl font-semibold tracking-tight text-ink">
            {content.productsPage.categoriesHeading}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            {content.productsPage.categoriesIntro}
          </p>

          {groups.length === 0 ? (
            <GlassCard padding="lg" className="mt-10 text-center">
              <p className="text-sm text-muted">{content.productsPage.emptyCategories}</p>
            </GlassCard>
          ) : (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {groups.map(({ category, items }, index) => (
                <Reveal key={category.id} delay={index * 70} className="h-full">
                  <GlassCard interactive={items.length > 0} padding="lg" className="flex h-full flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <span
                        aria-hidden="true"
                        className="grid h-14 w-14 place-items-center rounded-glass-sm bg-gradient-to-br from-accent to-accent2 text-xl font-bold text-on-accent"
                      >
                        {category.name.charAt(0)}
                      </span>
                      <span className="chip">
                        {items.length} item{items.length === 1 ? "" : "s"}
                      </span>
                    </div>

                    <h3 className="mt-5 text-base font-semibold text-ink">{category.name}</h3>
                    {category.description ? (
                      <p className="mt-2 text-sm leading-relaxed text-muted">
                        {category.description}
                      </p>
                    ) : null}

                    {items.length > 0 ? (
                      <ul className="mt-4 flex flex-wrap gap-1.5">
                        {items.slice(0, 3).map((product) => (
                          <li key={product.id} className="chip">
                            {product.name}
                          </li>
                        ))}
                        {items.length > 3 ? (
                          <li className="chip">+{items.length - 3} more</li>
                        ) : null}
                      </ul>
                    ) : null}

                    <div className="mt-auto pt-6">
                      {items.length === 0 ? (
                        <p className="text-sm text-muted">{content.productsPage.emptyCategory}</p>
                      ) : (
                        <Link
                          href={`/shop?category=${category.id}`}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-accent"
                        >
                          {content.shop.labels.browse}
                          <ArrowRight size={15} aria-hidden="true" />
                        </Link>
                      )}
                    </div>
                  </GlassCard>
                </Reveal>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
