const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

export const SITE_URL = configuredUrl ? new URL(configuredUrl) : null;
