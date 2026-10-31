"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Clock3, PackageCheck } from "lucide-react";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { content } from "@/content/site";
import { formatPaisa, formatQuantity } from "@/lib/utils";
import { trackOrderResultSchema, type TrackedOrder } from "@/lib/tracking-validation";

const FIELD =
  "glass-line w-full rounded-full px-4 py-3 text-sm text-ink placeholder:text-muted focus:outline-none";

function readableStatus(value: string): string {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function TrackForm({ initialOrderNumber = "" }: { initialOrderNumber?: string }) {
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setOrder(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: formData.get("orderNumber"),
          phone: formData.get("phone"),
        }),
      });
      const result: unknown = await response.json();

      if (!response.ok) {
        const message =
          typeof result === "object" &&
          result !== null &&
          "error" in result &&
          typeof result.error === "string"
            ? result.error
            : "Could not look up this order. Please try again.";
        setError(message);
        return;
      }

      const trackedOrder = trackOrderResultSchema.safeParse(result);
      if (!trackedOrder.success) {
        setError("Order tracking returned an unexpected response. Please try again later.");
        return;
      }
      setOrder(trackedOrder.data);
    } catch {
      setError("Could not reach order tracking. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="order-number" className="mb-2 block text-xs font-medium text-muted">
            {content.track.orderNumberLabel}
          </label>
          <input
            id="order-number"
            name="orderNumber"
            required
            autoComplete="off"
            defaultValue={initialOrderNumber}
            placeholder="WEB-XXXXXXXXXXXX-XXXXXX"
            className={FIELD}
          />
        </div>

        <div>
          <label htmlFor="order-phone" className="mb-2 block text-xs font-medium text-muted">
            {content.track.phoneLabel}
          </label>
          <input
            id="order-phone"
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            inputMode="tel"
            placeholder={content.track.phonePlaceholder}
            className={FIELD}
          />
        </div>

        {error ? (
          <p role="alert" className="text-sm text-red-500">
            {error}
          </p>
        ) : null}

        <GlassButton type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Looking up order…" : content.track.cta}
        </GlassButton>
      </form>

      {order ? (
        <GlassCard
          as="section"
          aria-labelledby="tracking-result-title"
          aria-live="polite"
          padding="md"
        >
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent/15 text-accent">
              {order.status === "delivered" ? (
                <CheckCircle2 size={20} aria-hidden="true" />
              ) : (
                <PackageCheck size={20} aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                {order.orderNumber}
              </p>
              <h2 id="tracking-result-title" className="mt-1 text-lg font-semibold text-ink">
                {readableStatus(order.status)}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {order.branchName ? `${order.branchName} · ` : ""}
                {order.fulfillmentType === "pickup" ? "Store pickup" : "Home delivery"}
              </p>
            </div>
            <p className="shrink-0 text-sm font-semibold text-accent">
              {formatPaisa(order.totalPaisa)}
            </p>
          </div>

          <div className="mt-5 border-t border-line/10 pt-4">
            <h3 className="text-sm font-semibold text-ink">Order items</h3>
            <ul className="mt-3 space-y-2">
              {order.items.map((item, index) => (
                <li
                  key={`${item.productName}-${index}`}
                  className="flex justify-between gap-3 text-sm"
                >
                  <span className="text-muted">
                    {item.productName} · {formatQuantity(item.quantityMilli, item.unitCode)}
                  </span>
                  <span className="shrink-0 font-medium text-ink">
                    {formatPaisa(item.lineTotalPaisa)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5 border-t border-line/10 pt-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Clock3 size={16} aria-hidden="true" className="text-accent" />
              Recent updates
            </div>
            {order.events.length ? (
              <ol className="mt-3 space-y-3">
                {order.events.map((update, index) => (
                  <li key={`${update.occurredAt}-${index}`} className="flex gap-3 text-sm">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                    <span>
                      <span className="block font-medium text-ink">
                        {readableStatus(update.nextStatus ?? update.eventType)}
                      </span>
                      <time
                        className="text-xs text-muted"
                        dateTime={update.occurredAt}
                      >
                        {new Date(update.occurredAt).toLocaleString()}
                      </time>
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-2 text-sm text-muted">Your order has been received.</p>
            )}
          </div>

          <p className="mt-5 text-xs text-muted">
            Payment status: {readableStatus(order.paymentStatus)}
          </p>
        </GlassCard>
      ) : null}
    </div>
  );
}
