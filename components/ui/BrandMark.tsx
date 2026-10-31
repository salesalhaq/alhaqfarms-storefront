import Image from "next/image";
import { cn } from "@/lib/utils";
import type { BrandSettings } from "@/lib/brand";

interface BrandMarkProps {
  brand: BrandSettings;
  size?: number;
  className?: string;
}

/**
 * Brand logo, or a monogram cut from the business name when no logo is set.
 * Never falls back to a hardcoded vendor name.
 */
export function BrandMark({ brand, size = 40, className }: BrandMarkProps) {
  const monogram = (brand.businessName.trim()[0] ?? "S").toUpperCase();

  if (brand.logoUrl) {
    return (
      <Image
        src={brand.logoUrl}
        alt=""
        width={size}
        height={size}
        unoptimized={brand.logoUrl.startsWith("data:")}
        className={cn("rounded-glass-sm object-contain", className)}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: size * 0.44 }}
      className={cn(
        "grid place-items-center rounded-glass-sm bg-gradient-to-br from-accent to-accent2 font-bold text-on-accent",
        className
      )}
    >
      {monogram}
    </span>
  );
}
