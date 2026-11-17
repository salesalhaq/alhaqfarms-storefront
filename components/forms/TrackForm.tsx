"use client";

import { useState, type FormEvent } from "react";
import { AlertCircle, CheckCircle2, Clock3, PackageCheck } from "lucide-react";
import { PaymentResubmitForm } from "@/components/forms/PaymentResubmitForm";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { content } from "@/content/site";
import { formatPaisa, formatQuantity } from "@/lib/utils";
import { trackOrderResultSchema, type TrackedOrder } from "@/lib/tracking-validation";

const FIELD =
  "glass-line w-full rounded-full px-4 py-3 text-sm text-ink placeholder:text-muted transition-colors focus:border-accent2/60 focus-visible:outline-none";

function readableStatus(value: string): string {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function updateLabel(update: { eventType: string; nextStatus: string | null }): string {
  return update.eventType.startsWith("payment_")
    ? readableStatus(update.eventType)
    : readableStatus(update.nextStatus ?? update.eventType);
}

function paymentLabel(order: TrackedOrder): string {
  if (order.paymentReviewStatus === "rejected") return "Rejected";
  if (order.paymentReviewStatus === "verified") return "Verified";
  return readableStatus(order.paymentStatus);
}

export function TrackForm({ initialOrderNumber = "" }: { initialOrderNumber?: string }) {
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lookup, setLookup] = useState<{ orderNumber: string; phone: string } | null>(null);
  const [resubmitted, setResubmitted] = useState(false);

  async function lookupOrder(orderNumber: string, phone: string) {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, phone }),
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
      setLookup({ orderNumber, phone });
    } catch {
      setError("Could not reach order tracking. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOrder(null);
    setResubmitted(false);
    const formData = new FormData(event.currentTarget);
    await lookupOrder(String(formData.get("orderNumber") ?? ""), String(formData.get("phone") ?? ""));
  }

  const rejected = order?.paymentReviewStatus === "rejected";

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

          {rejected ? (
            <div
              role="alert"
              className="mt-5 rounded-glass-sm border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200"
            >
              <p className="flex items-center gap-2 font-semibold">
                <AlertCircle size={16} aria-hidden="true" />
                Your payment receipt was rejected
              </p>
              {order.paymentRejectionReason ? (
                <p className="mt-2">Reason: {order.paymentRejectionReason}</p>
              ) : null}
              <p className="mt-2 text-red-200/80">
                Upload a corrected receipt below, or contact the branch if you need help.
              </p>
              {lookup ? (
                <PaymentResubmitForm
                  orderNumber={lookup.orderNumber}
                  phone={lookup.phone}
                  onSubmitted={() => {
                    setResubmitted(true);
                    void lookupOrder(lookup.orderNumber, lookup.phone);
                  }}
                />
              ) : null}
            </div>
          ) : null}

          {resubmitted && !rejected ? (
            <p className="mt-5 rounded-glass-sm border border-success/30 bg-success/10 p-4 text-sm text-success">
              Your new receipt was sent. Staff will review the payment again before the order moves forward.
            </p>
          ) : null}

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
                        {updateLabel(update)}
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
            Payment status: {paymentLabel(order)}
          </p>
        </GlassCard>
      ) : null}
    </div>
  );
}
