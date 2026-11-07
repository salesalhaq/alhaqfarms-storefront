import { NextResponse } from "next/server";
import { getRequestCustomer } from "@/lib/server-auth";
import { getServerSupabase } from "@/lib/server-supabase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const customer = await getRequestCustomer(request);
  if (!customer.userId) {
    return NextResponse.json(
      { error: customer.error ?? "Sign in to view your orders." },
      { status: customer.status ?? 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const { client } = await getServerSupabase();
  if (!client) {
    return NextResponse.json({ error: "Order history is temporarily unavailable." }, { status: 503 });
  }

  const { data: orders, error: orderError } = await client
    .schema("storefront")
    .rpc("storefront_customer_order_history", { p_customer_user_id: customer.userId });
  if (orderError) {
    return NextResponse.json({ error: "Could not load your order history. Please try again." }, { status: 503 });
  }
  if (!Array.isArray(orders)) {
    return NextResponse.json({ error: "Could not load your order history. Please try again." }, { status: 503 });
  }

  return NextResponse.json({ orders }, { headers: { "Cache-Control": "no-store" } });
}
