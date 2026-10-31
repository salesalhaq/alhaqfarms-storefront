import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * True only when real credentials are present. The storefront must still run
 * (with sample data) before Supabase and R2 are provisioned.
 */
export const isSupabaseConfigured = Boolean(
  url && anonKey && !url.includes("your_supabase")
);

let client: SupabaseClient | null = null;

/**
 * Anon-only client. Row Level Security is the boundary: the browser and the
 * server both use this key, and nothing here may read staff-only tables.
 */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!client) {
    client = createClient(url as string, anonKey as string, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
