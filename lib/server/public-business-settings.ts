import "server-only";

import { createClient } from "@supabase/supabase-js";
import { cache } from "react";
import {
  DEFAULT_BUSINESS_SETTINGS,
  parseBusinessSettings,
  type BusinessSettings,
} from "@/lib/business-settings";
import { getServerEnvironment } from "@/lib/server-supabase";

/**
 * Reads the shared shop branding without a staff session.
 *
 * Used by metadata, the web manifest, and the dynamic brand icon so the public
 * shell (login, install prompt, browser tab) matches the branding saved in
 * Settings → Shop & branding.
 */
export const getPublicBusinessSettings = cache(async (): Promise<BusinessSettings> => {
  try {
    const environment = await getServerEnvironment();
    if (!environment.NEXT_PUBLIC_SUPABASE_URL || !environment.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return DEFAULT_BUSINESS_SETTINGS;
    }

    const supabase = createClient(
      environment.NEXT_PUBLIC_SUPABASE_URL,
      environment.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false } },
    );

    const { data, error } = await supabase
      .from("web_business_settings")
      .select("settings")
      .eq("id", "shop")
      .maybeSingle();
    if (error) throw error;

    return data ? parseBusinessSettings(data.settings) : DEFAULT_BUSINESS_SETTINGS;
  } catch (error) {
    console.error("Could not load public business settings.", error);
    return DEFAULT_BUSINESS_SETTINGS;
  }
});
