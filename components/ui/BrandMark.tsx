import Image from "next/image";
import { cn } from "@/lib/utils";
import { brandInitials, type BrandSettings } from "@/lib/brand";

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
  const logo = brand.logoUrl;

  if (logo) {
    // The branding icon route can answer with an uploaded PNG/JPEG or a
    // generated SVG, so it is rendered directly instead of through the image
    // optimizer.
    if (logo.startsWith("/api/") || logo.startsWith("data:")) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo}
          alt=""
          width={size}
          height={size}
          className={cn("rounded-glass-sm object-contain", className)}
        />
      );
    }

    return (
      <Image
        src={logo}
        alt=""
        width={size}
        height={size}
        className={cn("rounded-glass-sm object-contain", className)}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      className={cn(
        "grid place-items-center rounded-glass-sm bg-gradient-to-br from-accent to-accent2 font-bold text-on-accent",
        className
      )}
    >
      {brandInitials(brand.businessName)}
    </span>
  );
}
