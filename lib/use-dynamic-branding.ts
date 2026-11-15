"use client";

import { useEffect } from "react";
import { DEFAULT_BRAND_COLOR, DEFAULT_BRAND_NAME, DEFAULT_BRAND_TAGLINE } from "@/lib/branding";
import { DEFAULT_BUSINESS_SETTINGS, type BusinessSettings } from "@/lib/business-settings";

function setMeta(attribute: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
}

function setIconLinks(href: string) {
  const links = Array.from(
    document.head.querySelectorAll<HTMLLinkElement>("link[rel~='icon'], link[rel='apple-touch-icon']"),
  );

  if (!links.length) {
    const icon = document.createElement("link");
    icon.rel = "icon";
    icon.href = href;
    document.head.appendChild(icon);
    return;
  }

  for (const link of links) link.href = href;
}

export function useDynamicBranding(settings: BusinessSettings) {
  useEffect(() => {
    const businessName = settings.businessName || DEFAULT_BUSINESS_SETTINGS.businessName || DEFAULT_BRAND_NAME;
    const description = settings.businessTagline || DEFAULT_BRAND_TAGLINE;

    // Update the browser tab title while keeping the saved brand name intact.
    document.title = businessName;

    setMeta("name", "description", description);
    setMeta("name", "application-name", businessName);
    setMeta("name", "apple-mobile-web-app-title", businessName);
    setMeta("property", "og:title", businessName);
    setMeta("property", "og:description", description);
    setMeta("name", "theme-color", settings.brandColor || DEFAULT_BRAND_COLOR);

    // Custom logo when uploaded, otherwise let the icon route serve the generated initials mark.
    setIconLinks(settings.logoDataUrl || "/api/public/branding/icon");
  }, [settings]);
}
