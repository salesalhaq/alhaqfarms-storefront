"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Palette, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { GLASS_THEMES } from "@/lib/brand";
import { buttonStyles } from "@/components/ui/GlassButton";
import { useTheme, type EffectsMode } from "@/components/theme/ThemeProvider";

const EFFECTS: ReadonlyArray<{ id: EffectsMode; label: string }> = [
  { id: "auto", label: "Auto" },
  { id: "full", label: "Full" },
  { id: "low", label: "Low" },
];

export function ThemeMenu() {
  const { glass, effects, setGlass, setEffects, mounted } = useTheme();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const activeGlass = GLASS_THEMES.find((theme) => theme.id === glass) ?? GLASS_THEMES[0];

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Appearance settings"
        className={buttonStyles("ghost", "sm", "w-10 px-0")}
      >
        <Palette size={18} aria-hidden="true" />
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="Appearance settings"
          className="glass-strong absolute right-0 top-12 z-50 w-64 rounded-glass p-4"
        >
          <fieldset>
            <legend className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">
              Glass theme
            </legend>
            <div className="grid grid-cols-5 gap-2">
              {GLASS_THEMES.map((theme) => {
                const active = mounted && glass === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setGlass(theme.id)}
                    aria-pressed={active}
                    title={theme.label}
                    className={cn(
                      "grid h-8 place-items-center rounded-full border transition-transform",
                      active ? "border-ink/50 scale-105" : "border-line/15 hover:scale-105"
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className="h-5 w-5 rounded-full"
                      style={{ backgroundColor: theme.swatch }}
                    />
                    <span className="sr-only">{theme.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[0.6875rem] text-muted">Active: {activeGlass.label}</p>
          </fieldset>

          <fieldset className="mt-4">
            <legend className="mb-2 flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">
              <Wand2 size={12} aria-hidden="true" />
              Effects
            </legend>
            <div className="grid grid-cols-3 gap-1.5">
              {EFFECTS.map((item) => {
                const active = mounted && effects === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setEffects(item.id)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-glass-sm border py-2 text-[0.6875rem] transition-colors",
                      active
                        ? "border-accent/50 bg-accent/15 text-ink"
                        : "border-line/10 bg-line/[0.04] text-muted hover:text-ink"
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[0.6875rem] leading-relaxed text-muted">
              Low turns off blur, motion and ambient glow.
            </p>
          </fieldset>
        </div>
      ) : null}
    </div>
  );
}
