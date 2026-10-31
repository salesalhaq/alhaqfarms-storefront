import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, CircleHelp } from "lucide-react";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassCard } from "@/components/ui/GlassCard";

export const metadata: Metadata = {
  title: "Order received",
  description: "Your Al-Haq Farms order has been received.",
};

interface ConfirmationPageProps {
  searchParams: Promise<{ order?: string; cleanup?: string }>;
}

export default async function OrderConfirmationPage({ searchParams }: ConfirmationPageProps) {
  const params = await searchParams;
  const orderNumber = params.order ?? "";
  const validOrderNumber = /^WEB-[0-9]{12}-[0-9A-F]{6}$/.test(orderNumber);

  return (
    <main className="px-4 pb-20 pt-16">
      <GlassCard padding="lg" className="mx-auto max-w-2xl text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-accent/15 text-accent">
          {validOrderNumber ? <CheckCircle2 size={32} /> : <CircleHelp size={32} />}
        </span>
        <h1 className="mt-6 text-3xl font-semibold text-ink">
          {validOrderNumber ? "Order received" : "Order confirmation"}
        </h1>
        {validOrderNumber ? (
          <>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Your order has been submitted to the selected branch. Keep this order number for your records.
            </p>
            <p className="mt-6 rounded-glass-sm bg-line/[0.04] px-4 py-3 font-mono text-lg font-semibold tracking-wide text-ink">
              {orderNumber}
            </p>
            <p className="mt-5 text-sm text-muted">
              For transfer payments, staff will verify your receipt before processing the order.
            </p>
            <Link
              href={`/track?order=${encodeURIComponent(orderNumber)}`}
              className="mt-5 inline-flex text-sm font-medium text-accent underline underline-offset-4"
            >
              Track this order
            </Link>
            {params.cleanup === "1" && (
              <p role="status" className="mt-4 text-sm text-amber-200">
                The order is confirmed. An unused retry receipt could not be cleaned up automatically; please include the order number if you contact support.
              </p>
            )}
          </>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-muted">
            We could not verify an order number in this link. If you have submitted an order, contact the selected branch to confirm it.
          </p>
        )}
        <Link href="/shop" className="mt-8 inline-flex">
          <GlassButton>Continue shopping</GlassButton>
        </Link>
      </GlassCard>
    </main>
  );
}
