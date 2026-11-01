import { createClient, type SupabaseClient } from "@supabase/supabase-js";

interface PublicAuthConfig {
  url: string;
  anonKey: string;
}

let clientPromise: Promise<SupabaseClient | null> | null = null;

async function createAuthClient(): Promise<SupabaseClient | null> {
  const response = await fetch("/api/auth/config", { cache: "no-store" });
  if (!response.ok) return null;

  const config: unknown = await response.json();
  if (
    typeof config !== "object" ||
    config === null ||
    !("url" in config) ||
    !("anonKey" in config) ||
    typeof config.url !== "string" ||
    typeof config.anonKey !== "string" ||
    !config.url.startsWith("https://") ||
    !config.anonKey
  ) {
    throw new Error("The account service returned invalid configuration.");
  }

  const publicConfig: PublicAuthConfig = { url: config.url, anonKey: config.anonKey };
  return createClient(publicConfig.url, publicConfig.anonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
  });
}

export function getSupabaseAuthClient(): Promise<SupabaseClient | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (!clientPromise) {
    clientPromise = createAuthClient().catch((error: unknown) => {
      clientPromise = null;
      throw error;
    });
  }
  return clientPromise;
}

export function safeRedirectPath(value: string | null, fallback = "/account"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;

  try {
    const url = new URL(value, "https://storefront.invalid");
    if (url.origin !== "https://storefront.invalid" || url.pathname === "/auth/callback") {
      return fallback;
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
