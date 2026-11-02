"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { GLASS_THEMES, type GlassTheme } from "@/lib/brand";

export type ColorMode = "light" | "dark" | "system";
export type EffectsMode = "auto" | "full" | "low";
export type ResolvedMode = "light" | "dark";

const STORAGE = {
  mode: "sf:mode",
  glass: "sf:glass",
  effects: "sf:effects",
} as const;

const DEFAULT_MODE: ColorMode = "light";
const DEFAULT_GLASS: GlassTheme = "palette-15-first";
const DEFAULT_EFFECTS: EffectsMode = "full";

interface ThemeContextValue {
  mode: ColorMode;
  glass: GlassTheme;
  effects: EffectsMode;
  resolvedMode: ResolvedMode;
  mounted: boolean;
  setMode: (mode: ColorMode) => void;
  setGlass: (glass: GlassTheme) => void;
  setEffects: (effects: EffectsMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isGlassTheme(value: string | null): value is GlassTheme {
  return GLASS_THEMES.some((theme) => theme.id === value);
}

function systemPrefersDark(): boolean {
  return typeof window !== "undefined"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
    : true;
}

function detectLowEffects(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  const conn = nav.connection ?? {};
  if (conn.saveData === true) return true;
  if (conn.effectiveType && /^(slow-2g|2g|3g)$/.test(conn.effectiveType)) return true;
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory > 0 && nav.deviceMemory <= 2) {
    return true;
  }
  if (typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency > 0 && nav.hardwareConcurrency <= 2) {
    return true;
  }
  return false;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ColorMode>(DEFAULT_MODE);
  const [glass, setGlassState] = useState<GlassTheme>(DEFAULT_GLASS);
  const [effects, setEffectsState] = useState<EffectsMode>(DEFAULT_EFFECTS);
  const [resolvedMode, setResolvedMode] = useState<ResolvedMode>("dark");
  const [mounted, setMounted] = useState(false);

  // Adopt whatever the pre-paint script decided, so controls match the page.
  useEffect(() => {
    const root = document.documentElement;
    const savedMode = localStorage.getItem(STORAGE.mode);
    const savedGlass = localStorage.getItem(STORAGE.glass);
    const savedEffects = localStorage.getItem(STORAGE.effects);

    setModeState(
      savedMode === "light" || savedMode === "dark" || savedMode === "system"
        ? savedMode
        : DEFAULT_MODE
    );
    setGlassState(isGlassTheme(savedGlass) ? savedGlass : DEFAULT_GLASS);
    setEffectsState(
      savedEffects === "full" || savedEffects === "low" || savedEffects === "auto"
        ? savedEffects
        : DEFAULT_EFFECTS
    );
    setResolvedMode((root.getAttribute("data-mode") as ResolvedMode) ?? "dark");
    setMounted(true);
  }, []);

  const applyMode = useCallback((nextMode: ColorMode) => {
    const resolved: ResolvedMode = nextMode === "system" ? (systemPrefersDark() ? "dark" : "light") : nextMode;
    document.documentElement.setAttribute("data-mode", resolved);
    setResolvedMode(resolved);
  }, []);

  const applyEffects = useCallback((nextEffects: EffectsMode) => {
    const root = document.documentElement;
    const low = nextEffects === "low" || (nextEffects === "auto" && detectLowEffects());
    if (low) root.setAttribute("data-effects", "low");
    else root.removeAttribute("data-effects");
  }, []);

  const setMode = useCallback(
    (nextMode: ColorMode) => {
      setModeState(nextMode);
      localStorage.setItem(STORAGE.mode, nextMode);
      applyMode(nextMode);
    },
    [applyMode]
  );

  const setGlass = useCallback((nextGlass: GlassTheme) => {
    setGlassState(nextGlass);
    localStorage.setItem(STORAGE.glass, nextGlass);
    document.documentElement.setAttribute("data-glass", nextGlass);
  }, []);

  const setEffects = useCallback(
    (nextEffects: EffectsMode) => {
      setEffectsState(nextEffects);
      localStorage.setItem(STORAGE.effects, nextEffects);
      applyEffects(nextEffects);
    },
    [applyEffects]
  );

  // Follow the operating system while the visitor is on "system".
  useEffect(() => {
    if (!mounted || mode !== "system") return;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyMode("system");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [mounted, mode, applyMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      glass,
      effects,
      resolvedMode,
      mounted,
      setMode,
      setGlass,
      setEffects,
    }),
    [mode, glass, effects, resolvedMode, mounted, setMode, setGlass, setEffects]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside a ThemeProvider");
  }
  return context;
}
