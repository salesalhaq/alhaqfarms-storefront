import { NextResponse } from "next/server";
import { quoteRequestSchema } from "@/lib/checkout-validation";
import { isSameOrigin } from "@/lib/request-security";
import { hmacHex } from "@/lib/server-crypto";
import { getServerSupabase } from "@/lib/server-supabase";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 20_000) {
    return NextResponse.json({ error: "The quote request is too large." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "The quote request is not valid JSON." }, { status: 400 });
  }

  const parsed = quoteRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Review the branch, fulfillment, and cart items." }, { status: 400 });
  }

  const { client, env } = await getServerSupabase();
  if (!client || !env.CHECKOUT_HASH_SECRET || env.CHECKOUT_HASH_SECRET.length < 32) {
    return NextResponse.json({ error: "Online checkout is not configured yet." }, { status: 503 });
  }

  const ipAddress =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const ipHash = await hmacHex(env.CHECKOUT_HASH_SECRET, `quote-ip:${ipAddress}`);
  const { error: rateLimitError } = await client
    .schema("storefront")
    .rpc("consume_storefront_quote_attempt", {
      p_ip_hash: ipHash,
    });
  if (rateLimitError) {
    console.error("Checkout quote rate-limit RPC failed.", {
      code: rateLimitError.code,
      message: rateLimitError.message,
    });
    return NextResponse.json(
      { error: rateLimitError.message.toLowerCase().includes("too many quote") ? "Please wait before refreshing your order quote." : "Checkout quoting is unavailable. Please try again later." },
      { status: rateLimitError.message.toLowerCase().includes("too many quote") ? 429 : 503 }
    );
  }

  const { data, error } = await client.schema("storefront").rpc("storefront_quote_web_order", {
    p_branch_id: parsed.data.branchId,
    p_fulfillment_type: parsed.data.fulfillmentType,
    p_city: parsed.data.city || null,
    p_items: parsed.data.items,
  });

  if (error) {
    console.error("Checkout quote calculation RPC failed.", {
      code: error.code,
      message: error.message,
    });
    const message = error.message.toLowerCase();
    const publicMessage =
      message.includes("stock") || message.includes("unavailable")
        ? "A product or delivery option is no longer available. Review your cart and location."
        : "We could not calculate this order. Check your branch and delivery location.";
    return NextResponse.json({ error: publicMessage }, { status: 422 });
  }

  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
}
