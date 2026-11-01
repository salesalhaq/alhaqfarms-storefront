"use client";

import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

const FIELD =
  "w-full rounded-full border border-line/15 bg-white/[0.06] px-4 py-2.5 text-sm text-ink placeholder:text-muted backdrop-blur-xl transition-colors focus:border-accent2/60 focus:outline-none";

export function GlassInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(FIELD, className)} {...props} />;
}

export function GlassTextarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(FIELD, "rounded-glass-sm", className)} {...props} />;
}

export function GlassSelect({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(FIELD, "appearance-none pr-9", className)} {...props}>
      {children}
    </select>
  );
}

export function GlassCheckbox({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={cn(
        "h-4 w-4 shrink-0 cursor-pointer rounded border border-line/25 bg-white/[0.06] accent-[rgb(var(--accent))]",
        className
      )}
      {...props}
    />
  );
}