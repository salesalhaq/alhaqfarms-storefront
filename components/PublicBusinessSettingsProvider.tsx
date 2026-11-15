"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DEFAULT_BUSINESS_SETTINGS,
  parseBusinessSettings,
  type BusinessSettings,
} from "@/lib/business-settings";
import { useDynamicBranding } from "@/lib/use-dynamic-branding";

interface PublicBusinessSettingsContextValue {
  settings: BusinessSettings;
  loading: boolean;
  error: string | null;
}

const PublicBusinessSettingsContext = createContext<PublicBusinessSettingsContextValue | null>(null);

export function PublicBusinessSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(DEFAULT_BUSINESS_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const response = await fetch("/api/public/business-settings", {
          cache: "no-store",
        });
        const result = await response.json() as { settings?: unknown; error?: string };
        if (!response.ok) throw new Error(result.error || "Business settings could not be loaded.");
        const parsed = parseBusinessSettings(result.settings);
        if (active) setSettings(parsed);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Business settings could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // Apply dynamic branding (title, metadata, theme color, and icons)
  useDynamicBranding(settings);

  const value = useMemo(
    () => ({ settings, loading, error }),
    [settings, loading, error],
  );
  return <PublicBusinessSettingsContext.Provider value={value}>{children}</PublicBusinessSettingsContext.Provider>;
}

export function usePublicBusinessSettings() {
  const context = useContext(PublicBusinessSettingsContext);
  if (!context) throw new Error("usePublicBusinessSettings must be used within a PublicBusinessSettingsProvider.");
  return context;
}

export function useOptionalPublicBusinessSettings() {
  return useContext(PublicBusinessSettingsContext);
}
