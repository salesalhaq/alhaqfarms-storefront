import { NextResponse } from "next/server";
import {
  normalizePakistanPhone,
  normalizePaymentReference,
  orderRequestSchema,
} from "@/lib/checkout-validation";
import { isSameOrigin } from "@/lib/request-security";
import { hmacHex, toHex } from "@/lib/server-crypto";
import { getServerSupabase } from "@/lib/server-supabase";

export const dynamic = "force-dynamic";

const MAX_REQUEST_BYTES = 5 * 1024 * 1024;
const MAX_RECEIPT_BYTES = 4 * 1024 * 1024;

interface TurnstileResponse {
  success: boolean;
  hostname?: string;
}

function textField(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
}

async function verifyTurnstile(
  token: string,
  secret: string,
  request: Request,
  ipAddress: string | null
): Promise<boolean> {
  const body = new URLSearchParams({ secret, response: token });
  if (ipAddress) body.set("remoteip", ipAddress);

  let response: Response;
  try {
    response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  } catch {
    return false;
  }
  if (!response.ok) return false;

  let result: TurnstileResponse;
  try {
    result = (await response.json()) as TurnstileResponse;
  } catch {
    return false;
  }
  return result.success && result.hostname === new URL(request.url).hostname;
}

function publicOrderError(message: string): { message: string; status: number } {
  const lower = message.toLowerCase();
  if (lower.includes("too many checkout")) {
    return { message: "Too many attempts. Please wait before trying again.", status: 429 };
  }
  if (lower.includes("stock") || lower.includes("product") || lower.includes("unavailable")) {
    return { message: "A product, branch, or delivery option is no longer available. Review your order.", status: 409 };
  }
  if (lower.includes("amount")) {
    return { message: "The transfer amount does not match the latest order total.", status: 422 };
  }
  if (lower.includes("cod") || lower.includes("cash on delivery")) {
    return { message: "Cash on delivery is not available for this order.", status: 422 };
  }
  if (lower.includes("payment") || lower.includes("transfer") || lower.includes("receipt")) {
    return { message: "The selected payment method or transfer receipt could not be accepted.", status: 422 };
  }
  if (lower.includes("city") || lower.includes("delivery") || lower.includes("branch")) {
    return { message: "The selected delivery location is not available.", status: 422 };
  }
  return { message: "We could not place the order. Review the details and try again.", status: 422 };
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    return NextResponse.json({ error: "The order request is too large." }, { status: 413 });
  }

  if (!request.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data")) {
    return NextResponse.json({ error: "Order details must be sent using the checkout form." }, { status: 415 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "The order request could not be read." }, { status: 400 });
  }

  let items: unknown;
  try {
    items = JSON.parse(textField(form, "items"));
  } catch {
    return NextResponse.json({ error: "The cart details are invalid." }, { status: 400 });
  }

  const paymentMethod = textField(form, "paymentMethod");
  const amountText = textField(form, "paymentAmountPaisa");
  const parsed = orderRequestSchema.safeParse({
    idempotencyKey: textField(form, "idempotencyKey"),
    branchId: textField(form, "branchId"),
    fulfillmentType: textField(form, "fulfillmentType"),
    city: textField(form, "city") || undefined,
    customerName: textField(form, "customerName"),
    customerPhone: textField(form, "customerPhone"),
    deliveryAddress: textField(form, "deliveryAddress") || undefined,
    paymentMethod,
    paymentReference: textField(form, "paymentReference") || undefined,
    paymentAmountPaisa: amountText || undefined,
    notes: textField(form, "notes") || undefined,
    turnstileToken: textField(form, "turnstileToken") || undefined,
    honeypot: textField(form, "website"),
    items,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Review the required checkout details and try again." }, { status: 400 });
  }

  const order = parsed.data;
  if (order.honeypot) {
    return NextResponse.json({ error: "The order could not be verified." }, { status: 400 });
  }

  const normalizedPhone = normalizePakistanPhone(order.customerPhone);
  if (!normalizedPhone) {
    return NextResponse.json({ error: "Enter a valid Pakistan mobile number." }, { status: 400 });
  }
  if (
    order.fulfillmentType === "delivery" &&
    (!order.city ||
      !order.deliveryAddress ||
      order.deliveryAddress.length < 5 ||
      order.deliveryAddress.length + order.city.length + 2 > 500)
  ) {
    return NextResponse.json({ error: "Enter a delivery city and an address within the allowed length." }, { status: 400 });
  }
  if (order.paymentMethod === "cash_on_delivery" && order.fulfillmentType !== "delivery") {
    return NextResponse.json({ error: "Cash on delivery is available for delivery orders only." }, { status: 422 });
  }

  const { client, env } = await getServerSupabase();
  if (!client || !env.TURNSTILE_SECRET_KEY || !env.CHECKOUT_HASH_SECRET || !env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
    return NextResponse.json({ error: "Secure online checkout is not configured yet." }, { status: 503 });
  }
  if (env.CHECKOUT_HASH_SECRET.length < 32) {
    return NextResponse.json({ error: "Secure online checkout is not configured correctly." }, { status: 503 });
  }

  const token = order.turnstileToken;
  if (!token) {
    return NextResponse.json({ error: "Complete the security check before placing your order." }, { status: 400 });
  }
  const ipAddress =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null;
  if (!(await verifyTurnstile(token, env.TURNSTILE_SECRET_KEY, request, ipAddress))) {
    return NextResponse.json({ error: "Security verification failed. Please try again." }, { status: 403 });
  }

  const paymentReference =
    order.paymentMethod === "cash_on_delivery"
      ? null
      : normalizePaymentReference(order.paymentReference ?? "");
  const receiptEntry = form.get("receipt");
  const receipt = receiptEntry instanceof File && receiptEntry.size > 0 ? receiptEntry : null;

  if (order.paymentMethod !== "cash_on_delivery") {
    if (!paymentReference || !/^[A-Z0-9._/-]{3,100}$/.test(paymentReference)) {
      return NextResponse.json({ error: "Enter a valid transfer reference." }, { status: 400 });
    }
    if (!order.paymentAmountPaisa || !receipt) {
      return NextResponse.json({ error: "The transfer amount and receipt image are required." }, { status: 400 });
    }
    if (receipt.type !== "image/jpeg" || receipt.size > MAX_RECEIPT_BYTES) {
      return NextResponse.json({ error: "Upload a JPEG receipt no larger than 4 MB." }, { status: 400 });
    }
    const header = new Uint8Array(await receipt.slice(0, 3).arrayBuffer());
    if (header.length !== 3 || header[0] !== 0xff || header[1] !== 0xd8 || header[2] !== 0xff) {
      return NextResponse.json({ error: "The receipt file is not a valid JPEG image." }, { status: 400 });
    }
  } else if (receipt || order.paymentReference || order.paymentAmountPaisa !== undefined) {
    return NextResponse.json({ error: "Cash on delivery must not include transfer details." }, { status: 400 });
  }

  const phoneHash = await hmacHex(env.CHECKOUT_HASH_SECRET, `phone:${normalizedPhone}`);
  const ipHash = await hmacHex(env.CHECKOUT_HASH_SECRET, `ip:${ipAddress ?? "unknown"}`);
  const { error: rateLimitError } = await client
    .schema("storefront")
    .rpc("consume_storefront_checkout_attempt", {
      p_phone_hash: phoneHash,
      p_ip_hash: ipHash,
    });
  if (rateLimitError) {
    if (rateLimitError.message.toLowerCase().includes("too many checkout")) {
      return NextResponse.json({ error: "Too many attempts. Please wait before trying again." }, { status: 429 });
    }
    return NextResponse.json({ error: "Checkout verification is unavailable. Please try again later." }, { status: 503 });
  }

  const timestamp = String(Date.now()).slice(-12);
  const randomSuffix = Array.from(crypto.getRandomValues(new Uint8Array(3)), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("").toUpperCase();
  const orderNumber = `WEB-${timestamp}-${randomSuffix}`;
  let proofPath: string | null = null;
  let referenceHash: string | null = null;
  let screenshotHash: string | null = null;

  if (receipt && paymentReference) {
    const referenceDigest = await hmacHex(env.CHECKOUT_HASH_SECRET, `reference:${paymentReference}`);
    const screenshotDigest = await crypto.subtle.digest("SHA-256", await receipt.arrayBuffer());
    referenceHash = referenceDigest;
    screenshotHash = toHex(screenshotDigest);
    proofPath = `${order.branchId}/${orderNumber}/receipt-${crypto.randomUUID()}.jpg`;

    const { error: uploadError } = await client.storage
      .from("web-order-payment-proofs")
      .upload(proofPath, receipt, { contentType: "image/jpeg", cacheControl: "0", upsert: false });
    if (uploadError) {
      return NextResponse.json({ error: "The receipt could not be securely uploaded. Please retry." }, { status: 502 });
    }
  }

  const { data, error: createError } = await client
    .schema("storefront")
    .rpc("storefront_create_web_order", {
      p_idempotency_key: order.idempotencyKey,
      p_order_number: orderNumber,
      p_branch_id: order.branchId,
      p_fulfillment_type: order.fulfillmentType,
      p_city: order.fulfillmentType === "delivery" ? order.city ?? null : null,
      p_customer_name: order.customerName,
      p_customer_phone: normalizedPhone,
      p_delivery_address:
        order.fulfillmentType === "delivery"
          ? `${order.deliveryAddress}, ${order.city}`
          : null,
      p_payment_method: order.paymentMethod,
      p_payment_reference: paymentReference,
      p_payment_amount_paisa: order.paymentMethod === "cash_on_delivery" ? null : order.paymentAmountPaisa ?? null,
      p_payment_proof_path: proofPath,
      p_payment_reference_hash: referenceHash,
      p_screenshot_sha256: screenshotHash,
      p_items: order.items,
      p_notes: order.notes ?? null,
    });

  if (createError) {
    if (proofPath) {
      const { error: cleanupError } = await client.storage.from("web-order-payment-proofs").remove([proofPath]);
      if (cleanupError) {
        return NextResponse.json(
          { error: "The order was not saved and receipt cleanup failed. Contact support before retrying." },
          { status: 500 }
        );
      }
    }
    const publicError = publicOrderError(createError.message);
    return NextResponse.json({ error: publicError.message }, { status: publicError.status });
  }

  const result = data as Record<string, unknown> | null;
  if (!result || typeof result.orderNumber !== "string") {
    if (proofPath) {
      const { error: cleanupError } = await client.storage.from("web-order-payment-proofs").remove([proofPath]);
      if (cleanupError) {
        return NextResponse.json({ error: "The order response was invalid and receipt cleanup failed. Contact support." }, { status: 500 });
      }
    }
    return NextResponse.json({ error: "The order service returned an invalid response. Please contact support." }, { status: 502 });
  }

  if (result.duplicate === true && proofPath) {
    const { error: cleanupError } = await client.storage.from("web-order-payment-proofs").remove([proofPath]);
    if (cleanupError) {
      return NextResponse.json({ ...result, cleanupPending: true }, {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      });
    }
  }

  return NextResponse.json(result, {
    status: result.duplicate === true ? 200 : 201,
    headers: { "Cache-Control": "no-store" },
  });
}
