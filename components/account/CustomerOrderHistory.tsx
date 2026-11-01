"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { formatPaisa, formatQuantity } from "@/lib/utils";
import { useWishlist } from "@/lib/wishlist";

interface OrderLine {
  name: string;
  unitCode: string;
  quantityMilli: number;
  lineTotalPaisa: number;
}

interface CustomerOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalPaisa: number;
  createdAt: string;
  branchName: string;
  items: OrderLine[];
}

interface OrdersResponse {
  orders: CustomerOrder[];
}

function displayStatus(value: string): string {
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function CustomerOrderHistory() {
  const { session, ready } = useWishlist();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      if (!ready) return;
      if (!session) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/account/orders", {
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: "no-store",
        });
        const result: unknown = await response.json();
        if (!response.ok) {
          const message = typeof result === "object" && result !== null && "error" in result &&
            typeof result.error === "string" ? result.error : "Could not load your order history.";
          throw new Error(message);
        }
        if (typeof result !== "object" || result === null || !("orders" in result) || !Array.isArray(result.orders)) {
          throw new Error("The order history service returned an invalid response.");
        }
        if (active) setOrders((result as OrdersResponse).orders);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load your order history.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => { active = false; };
  }, [ready, session]);

  return (
    <GlassCard as="section" padding="lg">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent2">Your purchases</p>
          <h2 className="mt-1 text-2xl font-semibold text-ink">Order history</h2>
        </div>
        <Link href="/track" className="text-sm font-semibold text-accent2 hover:underline">Track an order</Link>
      </div>

      {loading && <p className="mt-6 text-sm text-muted" role="status">Loading your orders…</p>}
      {error && <p className="mt-6 rounded-glass-sm border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200" role="alert">{error}</p>}
      {!loading && !error && orders.length === 0 && (
        <p className="mt-6 text-sm text-muted">No account-linked orders yet. Orders placed while signed in will appear here.</p>
      )}
      {!loading && orders.length > 0 && (
        <ul className="mt-6 space-y-4">
          {orders.map((order) => (
            <li key={order.id} className="rounded-glass-sm border border-line/10 p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{order.orderNumber}</p>
                  <p className="mt-1 text-xs text-muted">
                    {new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.createdAt))}
                    {" · "}{order.branchName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-accent2">{formatPaisa(order.totalPaisa)}</p>
                  <p className="mt-1 text-xs capitalize text-muted">
                    {displayStatus(order.status)} · {displayStatus(order.paymentStatus)}
                  </p>
                </div>
              </div>
              <ul className="mt-4 space-y-1 border-t border-line/10 pt-3 text-sm text-muted">
                {order.items.map((item, index) => (
                  <li key={`${order.id}-${index}`} className="flex justify-between gap-3">
                    <span>{item.name} · {formatQuantity(item.quantityMilli, item.unitCode)} {item.unitCode}</span>
                    <span>{formatPaisa(item.lineTotalPaisa)}</span>
                  </li>
                ))}
              </ul>
              <Link href={`/track?order=${encodeURIComponent(order.orderNumber)}`}
                className="mt-4 inline-block text-sm font-semibold text-accent2 hover:underline">
                Track order
              </Link>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}
