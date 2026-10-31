import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { buttonStyles } from "@/components/ui/GlassButton";

export default function NotFound() {
  return (
    <main className="px-4 pb-24 pt-10">
      <div className="mx-auto w-full max-w-md">
        <GlassCard padding="lg" className="text-center">
          <p className="text-accent-gradient text-5xl font-semibold tracking-tight">404</p>
          <h1 className="mt-4 text-xl font-semibold text-ink">Page not found</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            The page you are looking for has moved or never existed.
          </p>
          <div className="mt-7 flex justify-center gap-3">
            <Link href="/" className={buttonStyles("primary", "md")}>
              Go home
            </Link>
            <Link href="/shop" className={buttonStyles("secondary", "md")}>
              Browse shop
            </Link>
          </div>
        </GlassCard>
      </div>
    </main>
  );
}
