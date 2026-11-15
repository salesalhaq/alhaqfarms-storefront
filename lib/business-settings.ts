import { DEFAULT_BRAND_COLOR, isBrandColor } from "@/lib/branding";

export interface BusinessSettings {
  businessName: string;
  businessTagline: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  businessWebsite: string;
  brandColor: string;
  logoDataUrl: string;
}

export const DEFAULT_BUSINESS_SETTINGS: BusinessSettings = {
  businessName: "Al Haq Farms & Meats",
  businessTagline: "Pure. Fresh. Perfected.",
  businessAddress: "",
  businessPhone: "",
  businessEmail: "",
  businessWebsite: "",
  brandColor: DEFAULT_BRAND_COLOR,
  logoDataUrl: "",
};

const MAX_LOGO_DATA_URL_LENGTH = 2_100_000;

export function parseBusinessSettings(value: unknown): BusinessSettings {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Business settings have an invalid format.");
  }
  const record = value as Record<string, unknown>;
  const text = (key: string, fallback: string, maxLength: number): string => {
    const item = record[key] ?? fallback;
    if (typeof item !== "string" || item.length > maxLength) {
      throw new Error("Business settings contain an invalid text value.");
    }
    return item.trim();
  };

  const businessEmail = text("businessEmail", DEFAULT_BUSINESS_SETTINGS.businessEmail, 254);
  if (businessEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(businessEmail)) {
    throw new Error("Enter a valid business email address.");
  }
  const businessWebsite = text("businessWebsite", "", 254);
  if (businessWebsite) {
    try {
      const website = new URL(businessWebsite);
      if (website.protocol !== "http:" && website.protocol !== "https:") throw new Error();
    } catch {
      throw new Error("Enter a valid business website URL.");
    }
  }

  const logoDataUrl = text("logoDataUrl", "", MAX_LOGO_DATA_URL_LENGTH);
  if (logoDataUrl && !/^data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/i.test(logoDataUrl)) {
    throw new Error("Choose a supported PNG, JPEG, WebP, or GIF logo.");
  }

  const brandColor = text("brandColor", DEFAULT_BUSINESS_SETTINGS.brandColor, 7)
    || DEFAULT_BUSINESS_SETTINGS.brandColor;
  if (!isBrandColor(brandColor)) {
    throw new Error("Choose a valid brand color.");
  }

  return {
    businessName: text("businessName", DEFAULT_BUSINESS_SETTINGS.businessName, 200),
    businessTagline: text("businessTagline", DEFAULT_BUSINESS_SETTINGS.businessTagline, 200),
    businessAddress: text("businessAddress", "", 500),
    businessPhone: text("businessPhone", "", 50),
    businessEmail,
    businessWebsite,
    brandColor,
    logoDataUrl,
  };
}
