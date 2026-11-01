import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "default" | "gold" | "crimson" | "success";

interface GlassBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  tone?: Tone;
}

const TONES: Record<Tone, string> = {
  default: "border-line/20 bg-white/[0.06] text-muted",
  gold: "border-accent2/40 bg-accent2/12 text-accent2",
  crimson: "border-accent/45 bg-accent/15 text-ink",
  success: "border-success/45 bg-success/15 text-success",
};

export function GlassBadge({ children, tone = "default", className, ...props }: GlassBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] backdrop-blur-xl",
        TONES[tone],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}