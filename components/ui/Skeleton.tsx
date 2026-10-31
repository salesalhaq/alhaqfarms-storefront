import { cn } from "@/lib/utils";

/** Shimmer placeholder used while catalog data is loading. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden="true" />;
}
