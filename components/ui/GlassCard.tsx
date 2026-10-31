import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Adds a gentle lift on pointer hover. Disabled on touch by CSS. */
  interactive?: boolean;
  /** Padding preset; pass "none" to control padding yourself. */
  padding?: "none" | "sm" | "md" | "lg";
  /** Uses the high-saturation accent glass style. */
  variant?: "default" | "accent";
  /** The HTML element to render as. */
  as?: "div" | "article" | "section" | "main" | "aside" | "header" | "footer";
}

const PADDING: Record<NonNullable<GlassCardProps["padding"]>, string> = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8 sm:p-10",
};

export function GlassCard({
  children,
  className,
  interactive = false,
  padding = "md",
  variant = "default",
  as: Component = "div",
  ...props
}: GlassCardProps) {
  return (
    <Component
      className={cn(
        variant === "accent" ? "glass-accent" : "glass",
        PADDING[padding],
        interactive &&
          "transition-[transform,box-shadow] duration-500 ease-spring hover:-translate-y-1 hover:shadow-[0_34px_70px_-30px_rgb(var(--accent)/0.45)]",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
