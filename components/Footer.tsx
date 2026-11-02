import Link from "next/link";
import Image from "next/image";
import { Download, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { InstallPwaButton } from "@/components/ui/InstallPwaButton";
import { content, navigation } from "@/content/site";
import { whatsappLink, type BrandSettings } from "@/lib/brand";
import { getStorefrontCategories } from "@/lib/catalog";

interface FooterProps {
  brand: BrandSettings;
}

export async function Footer({ brand }: FooterProps) {
  const categories = await getStorefrontCategories();
  const phone = brand.phone || content.contact.phone;
  const email = brand.email || content.contact.email;
  const address = brand.address || content.contact.address;
  const whatsapp = brand.whatsapp || content.contact.whatsapp;

  return (
    <footer className="bg-bg-elevated/60 px-4 pb-8 pt-6 backdrop-blur-xl">
      <GlassCard padding="lg" className="mx-auto w-full max-w-6xl">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.25fr_0.8fr_1.1fr_0.95fr] lg:gap-10">
          <div className="lg:col-span-1">
            <Link href="/" aria-label={brand.businessName} className="inline-flex">
              <Image
                src="/assets/brand/alhaq-farms-logo.jpg"
                alt="Al Haq Farms & Meats — Pure, Fresh, Hygiene"
                width={160}
                height={164}
                className="h-28 w-28 rounded-glass-sm bg-white object-contain p-1"
              />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted">{content.footer.about}</p>
          </div>

          <nav aria-label="Explore" className="text-sm">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              {content.footer.exploreHeading}
            </h2>
            <ul className="space-y-2.5">
              {navigation.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-muted transition-colors hover:text-ink">
                    {item.label}
                  </Link>
                </li>
              ))}
              {categories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/shop?category=${category.id}`}
                    className="text-muted transition-colors hover:text-ink"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="text-sm">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              Contact
            </h2>
            <ul className="space-y-3">
              <li>
                <a href={`tel:${phone.replace(/\s/g, "")}`} className="flex items-start gap-2.5 text-muted transition-colors hover:text-ink">
                  <Phone size={15} aria-hidden="true" className="mt-0.5 shrink-0" />
                  <span>{phone}</span>
                </a>
              </li>
              <li>
                <a href={`mailto:${email}`} className="flex items-start gap-2.5 text-muted transition-colors hover:text-ink">
                  <Mail size={15} aria-hidden="true" className="mt-0.5 shrink-0" />
                  <span className="break-all">{email}</span>
                </a>
              </li>
              <li className="flex items-start gap-2.5 text-muted">
                <MapPin size={15} aria-hidden="true" className="mt-0.5 shrink-0" />
                <span>{address}</span>
              </li>
            </ul>
          </div>

          <div className="text-sm">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              {content.footer.chatHeading}
            </h2>
            <a
              href={whatsappLink(whatsapp)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-muted transition-colors hover:text-ink"
            >
              <MessageCircle size={15} aria-hidden="true" className="text-success" />
              <span>{content.footer.chatCta}</span>
            </a>

            <h2 className="mb-4 mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              {content.footer.appHeading}
            </h2>
            <ul className="space-y-2.5 text-muted">
              <li className="flex items-center gap-2">
                <a
                  href="https://www.alhaqfarms.com.pk/App/AlhaqFM.apk"
                  className="flex items-center gap-2 transition-colors hover:text-ink"
                  rel="noreferrer"
                >
                  <Download size={15} aria-hidden="true" />
                  {content.footer.androidCta}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <InstallPwaButton label={content.footer.pwaCta} />
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 grid gap-6 border-t border-line/10 pt-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-accent2">
              {content.footer.findUsHeading}
            </h2>
            <p className="mt-2 text-sm text-muted">{address}</p>
          </div>
          <div className="relative overflow-hidden rounded-glass border border-line/15">
            <iframe
              title="Map"
              src="https://www.openstreetmap.org/export/embed.html?bbox=71.85%2C33.95%2C72.15%2C34.15&layer=mapnik&marker=34.05%2C72.0"
              loading="lazy"
              className="h-36 w-full border-0 sm:h-40"
              style={{ filter: "invert(0.9) hue-rotate(180deg) brightness(0.8) contrast(0.9)" }}
            />
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-5 border-t border-line/10 pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>{content.footer.copyright}</p>

          <ul className="flex flex-wrap gap-2">
            {content.footer.social.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full border border-line/15 bg-white/[0.05] px-3 py-1.5 transition-colors hover:border-accent2/40 hover:text-accent2"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          <nav aria-label={content.footer.legalHeading}>
            <ul className="flex flex-wrap gap-x-4 gap-y-2">
              {content.footer.legal.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="transition-colors hover:text-ink">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </GlassCard>
    </footer>
  );
}
