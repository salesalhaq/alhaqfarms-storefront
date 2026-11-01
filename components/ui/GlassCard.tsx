"use client";

"use client";

import { cn } from "@/lib/utils";
import type { HTMLAttributes, MouseEvent, ReactNode } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Adds a gentle lift on pointer hover. Disabled on touch by CSS. */
  interactive?: boolean;
  /** Padding preset; pass "none" to control padding yourself. */
  padding?: "none" | "sm" | "md" | "lg";
  /** Glass surface flavour. */
  variant?: "default" | "strong" | "accent" | "crimson" | "gold";
  /** Adds a cursor-tracking radial spotlight. */
  spotlight?: boolean;
  /** Adds a light sweep on hover. */
  sweep?: boolean;
  /** The HTML element to render as. */
  as?: "div" | "article" | "section" | "main" | "aside" | "header" | "footer";
}

const PADDING: Record<NonNullable<GlassCardProps["padding"]>, string> = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8 sm:p-10",
};

const VARIANT: Record<NonNullable<GlassCardProps["variant"]>, string> = {
  default: "glass",
  strong: "glass-strong",
  accent: "glass-accent",
  crimson: "glass-crimson",
  gold: "glass-gold",
};

export function GlassCard({
  children,
  className,
  interactive = false,
  padding = "md",
  variant = "default",
  spotlight = false,
  sweep = false,
  as: Component = "div",
  onMouseMove,
  ...props
}: GlassCardProps) {
  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (spotlight) {
      const rect = event.currentTarget.getBoundingClientRect();
      event.currentTarget.style.setProperty("--x", `${event.clientX - rect.left}px`);
      event.currentTarget.style.setProperty("--y", `${event.clientY - rect.top}px`);
    }
    onMouseMove?.(event);
  };

  return (
    <Component
      onMouseMove={handleMouseMove}
      className={cn(
        VARIANT[variant],
        PADDING[padding],
        interactive && "glass-interactive",
        spotlight && "glass-spotlight",
        sweep && "glass-sweep",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
