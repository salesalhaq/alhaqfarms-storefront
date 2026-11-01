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
    .from("web_orders")
    .select("id, order_number, status, fulfillment_type, payment_status, total_paisa, created_at, branch_id")
    .eq("customer_user_id", customer.userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);
  if (orderError) {
    return NextResponse.json({ error: "Could not load your order history. Please try again." }, { status: 503 });
  }

  if (orders.length === 0) {
    return NextResponse.json({ orders: [] }, { headers: { "Cache-Control": "no-store" } });
  }

  const orderIds = orders.map((order) => order.id as string);
  const branchIds = [...new Set(orders.map((order) => order.branch_id as string))];
  const [itemsResult, branchesResult] = await Promise.all([
    client
      .from("web_order_items")
      .select("order_id, product_name, unit_code, quantity_milli, line_total_paisa")
      .in("order_id", orderIds)
      .is("deleted_at", null)
      .order("line_number", { ascending: true }),
    client.from("branches").select("id, name").in("id", branchIds),
  ]);
  if (itemsResult.error || branchesResult.error) {
    return NextResponse.json({ error: "Could not load order details. Please try again." }, { status: 503 });
  }

  const itemsByOrder = new Map<string, Array<Record<string, unknown>>>();
  for (const item of itemsResult.data) {
    const orderId = item.order_id as string;
    const items = itemsByOrder.get(orderId) ?? [];
    items.push({
      name: item.product_name,
      unitCode: item.unit_code,
      quantityMilli: Number(item.quantity_milli),
      lineTotalPaisa: Number(item.line_total_paisa),
    });
    itemsByOrder.set(orderId, items);
  }
  const branchNames = new Map(branchesResult.data.map((branch) => [branch.id as string, branch.name as string]));
  const result = orders.map((order) => ({
    id: order.id as string,
    orderNumber: order.order_number as string,
    status: order.status as string,
    fulfillmentType: order.fulfillment_type as string,
    paymentStatus: order.payment_status as string,
    totalPaisa: Number(order.total_paisa),
    createdAt: order.created_at as string,
    branchName: branchNames.get(order.branch_id as string) ?? "Store",
    items: itemsByOrder.get(order.id as string) ?? [],
  }));

  return NextResponse.json({ orders: result }, { headers: { "Cache-Control": "no-store" } });
}
