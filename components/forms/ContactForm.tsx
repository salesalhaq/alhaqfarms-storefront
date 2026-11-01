"use client";

import { useState, type FormEvent } from "react";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { GlassButton } from "@/components/ui/GlassButton";
import { content } from "@/content/site";
import { BRAND_SETTINGS, whatsappLink } from "@/lib/brand";

const FIELD =
  "glass-line w-full rounded-full px-4 py-3 text-sm text-ink placeholder:text-muted transition-colors focus:border-accent2/60 focus-visible:outline-none";
const AREA =
  "glass-line w-full rounded-glass px-4 py-3 text-sm text-ink placeholder:text-muted transition-colors focus:border-accent2/60 focus-visible:outline-none";

const [NAME, EMAIL, PHONE, SUBJECT, MESSAGE] = content.contact.form.fields;

export function ContactForm() {
  const [whatsappMessage, setWhatsappMessage] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const lines = [
      `Hello Al Haq Farms & Meats,`,
      `Name: ${String(formData.get("name") ?? "").trim()}`,
      `Email: ${String(formData.get("email") ?? "").trim()}`,
      formData.get("phone") ? `Phone: ${String(formData.get("phone")).trim()}` : "",
      formData.get("subject") ? `Subject: ${String(formData.get("subject")).trim()}` : "",
      "",
      String(formData.get("message") ?? "").trim(),
    ].filter(Boolean);

    setWhatsappMessage(lines.join("\n"));
  }

  if (whatsappMessage) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-accent/15 text-accent">
          <CheckCircle2 size={24} aria-hidden="true" />
        </span>
        <p className="text-base font-semibold text-ink">Your message is ready</p>
        <p className="max-w-sm text-sm text-muted">
          Continue to WhatsApp and press Send there. Your message has not been sent yet.
        </p>
        <a
          href={whatsappLink(BRAND_SETTINGS.whatsapp, whatsappMessage)}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-on-accent"
        >
          Continue to WhatsApp
          <ArrowUpRight size={16} aria-hidden="true" />
        </a>
        <button
          type="button"
          onClick={() => setWhatsappMessage(null)}
          className="mt-2 text-sm text-muted underline underline-offset-4 hover:text-ink"
        >
          Edit message
        </button>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="mb-2 block text-xs font-medium text-muted">
            {NAME}
          </label>
          <input
            id="contact-name"
            name="name"
            required
            maxLength={160}
            autoComplete="name"
            className={FIELD}
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="mb-2 block text-xs font-medium text-muted">
            {EMAIL}
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            className={FIELD}
          />
        </div>
        <div>
          <label htmlFor="contact-phone" className="mb-2 block text-xs font-medium text-muted">
            {PHONE}
          </label>
          <input
            id="contact-phone"
            name="phone"
            type="tel"
            maxLength={30}
            autoComplete="tel"
            inputMode="tel"
            className={FIELD}
          />
        </div>
        <div>
          <label htmlFor="contact-subject" className="mb-2 block text-xs font-medium text-muted">
            {SUBJECT}
          </label>
          <input id="contact-subject" name="subject" maxLength={160} className={FIELD} />
        </div>
      </div>

      <div>
        <label htmlFor="contact-message" className="mb-2 block text-xs font-medium text-muted">
          {MESSAGE}
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          maxLength={2000}
          required
          className={AREA}
        />
      </div>

      <GlassButton type="submit" size="lg" className="w-full sm:w-auto">
        {content.contact.form.submit}
      </GlassButton>
    </form>
  );
}
