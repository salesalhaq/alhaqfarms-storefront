import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

interface ServerEnvironment {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  CHECKOUT_HASH_SECRET?: string;
  NEXT_PUBLIC_TURNSTILE_SITE_KEY?: string;
}

export interface ServerSupabase {
  client: SupabaseClient | null;
  env: ServerEnvironment;
}

function readEnvironmentValue(source: unknown, key: string): string | undefined {
  if (typeof source !== "object" || source === null) return undefined;
  const value = Reflect.get(source, key);
  return typeof value === "string" ? value : undefined;
}

function toServerEnvironment(source: unknown): ServerEnvironment {
  return {
    NEXT_PUBLIC_SUPABASE_URL: readEnvironmentValue(source, "NEXT_PUBLIC_SUPABASE_URL"),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: readEnvironmentValue(source, "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    SUPABASE_SERVICE_ROLE_KEY: readEnvironmentValue(source, "SUPABASE_SERVICE_ROLE_KEY"),
    TURNSTILE_SECRET_KEY: readEnvironmentValue(source, "TURNSTILE_SECRET_KEY"),
    CHECKOUT_HASH_SECRET: readEnvironmentValue(source, "CHECKOUT_HASH_SECRET"),
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: readEnvironmentValue(source, "NEXT_PUBLIC_TURNSTILE_SITE_KEY"),
  };
}

export async function getServerEnvironment(): Promise<ServerEnvironment> {
  return process.env.NODE_ENV === "development"
    ? toServerEnvironment(process.env)
    : toServerEnvironment((await getCloudflareContext({ async: true })).env);
}

export async function getServerSupabase(): Promise<ServerSupabase> {
  const env = await getServerEnvironment();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  return {
    client:
      url && serviceRoleKey
        ? createClient(url, serviceRoleKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          })
        : null,
    env,
  };
}
