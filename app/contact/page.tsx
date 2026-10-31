import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ContactForm } from "@/components/forms/ContactForm";
import { buttonStyles } from "@/components/ui/GlassButton";
import { content } from "@/content/site";
import { BRAND_SETTINGS, whatsappLink } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Contact",
  description: content.contact.subtext,
};

export default function ContactPage() {
  const brand = BRAND_SETTINGS;
  const phone = brand.phone || content.contact.phone;
  const email = brand.email || content.contact.email;
  const address = brand.address || content.contact.address;
  const whatsapp = brand.whatsapp || content.contact.whatsapp;

  const details = [
    { Icon: Phone, label: content.contact.callLabel, value: phone, href: `tel:${phone.replace(/\s/g, "")}` },
    { Icon: Mail, label: content.contact.emailLabel, value: email, href: `mailto:${email}` },
    { Icon: MapPin, label: content.contact.visitLabel, value: address, href: null },
  ];

  return (
    <main className="px-4 pb-20 pt-4">
      <div className="mx-auto w-full max-w-6xl">
        <SectionHeading
          eyebrow="Get in touch"
          title={content.contact.heading}
          subtext={content.contact.subtext}
          align="left"
        />

        <div className="mt-10 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-5">
            {details.map(({ Icon, label, value, href }) => (
              <GlassCard key={label} className="flex items-start gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-glass-sm bg-accent/15 text-accent">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">{label}</p>
                  {href ? (
                    <a
                      href={href}
                      className="mt-1 block break-words text-sm font-medium text-ink transition-colors hover:text-accent"
                    >
                      {value}
                    </a>
                  ) : (
                    <p className="mt-1 text-sm font-medium text-ink">{value}</p>
                  )}
                </div>
              </GlassCard>
            ))}

            <GlassCard padding="lg">
              <h2 className="text-base font-semibold text-ink">
                Contact us on WhatsApp
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{content.contact.qrNote}</p>
              <a
                href={whatsappLink(whatsapp)}
                target="_blank"
                rel="noreferrer"
                className={`${buttonStyles("primary", "md")} mt-5`}
              >
                <MessageCircle size={17} aria-hidden="true" />
                {content.footer.chatCta}
              </a>
            </GlassCard>
          </div>

          <GlassCard padding="lg">
            <h2 className="text-lg font-semibold text-ink">Send us a message</h2>
            <p className="mt-1.5 text-sm text-muted">{content.contact.subtext}</p>
            <div className="mt-7">
              <ContactForm />
            </div>
          </GlassCard>
        </div>
      </div>
    </main>
  );
}
