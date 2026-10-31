import Link from "next/link";
import { Download, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { BrandMark } from "@/components/ui/BrandMark";
import { GlassCard } from "@/components/ui/GlassCard";
import { InstallPwaButton } from "@/components/ui/InstallPwaButton";
import { content, navigation } from "@/content/site";
import { whatsappLink, type BrandSettings } from "@/lib/brand";
import { SAMPLE_CATEGORIES } from "@/lib/catalog";

interface FooterProps {
  brand: BrandSettings;
}

export function Footer({ brand }: FooterProps) {
  const phone = brand.phone || content.contact.phone;
  const email = brand.email || content.contact.email;
  const address = brand.address || content.contact.address;
  const whatsapp = brand.whatsapp || content.contact.whatsapp;

  return (
    <footer className="px-4 pb-8 pt-6">
      <GlassCard padding="lg" className="mx-auto w-full max-w-6xl">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <BrandMark brand={brand} size={38} />
              <div className="leading-tight">
                <p className="text-base font-semibold text-ink">{brand.businessName}</p>
                <p className="text-xs text-muted">{brand.tagline}</p>
              </div>
            </div>
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
              {SAMPLE_CATEGORIES.map((category) => (
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
              <MessageCircle size={15} aria-hidden="true" />
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

            <h2 className="mb-4 mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              {content.footer.legalHeading}
            </h2>
            <ul className="flex flex-wrap gap-x-4 gap-y-2">
              {content.footer.legal.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-muted transition-colors hover:text-ink">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-line/10 pt-6 text-xs text-muted">
          {content.footer.copyright}
        </div>
      </GlassCard>
    </footer>
  );
}
