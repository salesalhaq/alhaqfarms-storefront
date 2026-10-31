import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap transition-all duration-300 ease-spring active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-on-accent shadow-[0_14px_34px_-16px_rgb(var(--accent)/0.9)] hover:brightness-110",
  secondary: "glass text-ink hover:brightness-125",
  ghost: "border border-transparent text-muted hover:bg-line/[0.06] hover:text-ink",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-[0.8125rem]",
  md: "h-11 px-6 text-sm",
  lg: "h-12 px-8 text-base",
};

/** Shared class builder so links and buttons can look identical. */
export function buttonStyles(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string
): string {
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function GlassButton({
  children,
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: GlassButtonProps) {
  return (
    <button type={type} className={buttonStyles(variant, size, className)} {...props}>
      {children}
    </button>
  );
}
