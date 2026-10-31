import { NextResponse } from "next/server";
import { normalizePakistanPhone } from "@/lib/checkout-validation";
import { isSameOrigin } from "@/lib/request-security";
import { hmacHex } from "@/lib/server-crypto";
import { getServerSupabase } from "@/lib/server-supabase";
import { trackOrderRequestSchema, trackOrderResultSchema } from "@/lib/tracking-validation";

export const dynamic = "force-dynamic";

const MAX_REQUEST_BYTES = 2_000;

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    return NextResponse.json({ error: "The tracking request is too large." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "The tracking request is not valid JSON." }, { status: 400 });
  }

  const parsed = trackOrderRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter the order number from your confirmation and a valid phone number." },
      { status: 400 }
    );
  }

  const phone = normalizePakistanPhone(parsed.data.phone);
  if (!phone) {
    return NextResponse.json({ error: "Enter a valid Pakistan mobile number." }, { status: 400 });
  }

  const { client, env } = await getServerSupabase();
  if (!client || !env.CHECKOUT_HASH_SECRET || env.CHECKOUT_HASH_SECRET.length < 32) {
    return NextResponse.json({ error: "Order tracking is not configured yet." }, { status: 503 });
  }

  const ipAddress =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const ipHash = await hmacHex(env.CHECKOUT_HASH_SECRET, `tracking-ip:${ipAddress}`);

  const { error: limitError } = await client
    .schema("storefront")
    .rpc("consume_storefront_tracking_attempt", {
      p_ip_hash: ipHash,
    });
  if (limitError) {
    const limited = limitError.message.toLowerCase().includes("too many tracking");
    return NextResponse.json(
      {
        error: limited
          ? "Too many tracking attempts. Please wait before trying again."
          : "Order tracking is unavailable. Please try again later.",
      },
      { status: limited ? 429 : 503 }
    );
  }

  const { data, error } = await client.schema("storefront").rpc("storefront_track_order", {
    p_order_number: parsed.data.orderNumber,
    p_customer_phone: phone,
  });
  if (error) {
    return NextResponse.json(
      { error: "Order tracking is unavailable. Please try again later." },
      { status: 503 }
    );
  }

  if (
    typeof data === "object" &&
    data !== null &&
    "error" in data
  ) {
    return NextResponse.json(
      { error: "We could not find that order. Check the order number and phone number." },
      { status: 404, headers: { "Cache-Control": "no-store" } }
    );
  }

  const result = trackOrderResultSchema.safeParse(data);
  if (!result.success) {
    return NextResponse.json(
      { error: "The tracking service returned an unexpected response." },
      { status: 502 }
    );
  }

  return NextResponse.json(result.data, {
    headers: { "Cache-Control": "no-store" },
  });
}
