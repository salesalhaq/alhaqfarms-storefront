import { NextResponse } from "next/server";
import {
  normalizePakistanPhone,
  normalizePaymentReference,
} from "@/lib/checkout-validation";
import { isSameOrigin } from "@/lib/request-security";
import { hmacHex } from "@/lib/server-crypto";
import { getServerSupabase } from "@/lib/server-supabase";

export const dynamic = "force-dynamic";

const MAX_REQUEST_BYTES = 5 * 1024 * 1024;
const MAX_RECEIPT_BYTES = 4 * 1024 * 1024;
const WALLET_METHODS = ["easypaisa", "jazzcash"];

function textField(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
}

interface ResubmitFailure {
  message: string;
  status: number;
}

function publicResubmitError(code: string): ResubmitFailure {
  switch (code) {
    case "Order not found":
      return { message: "We could not find that order with this phone number.", status: 404 };
    case "invalid_reference":
      return { message: "Enter a valid transfer reference.", status: 400 };
    case "invalid_proof":
      return { message: "The receipt upload could not be accepted. Please try again.", status: 400 };
    case "not_wallet":
      return { message: "This order does not need a transfer receipt.", status: 422 };
    case "closed":
      return { message: "This order is closed. Contact the branch for help.", status: 409 };
    case "not_rejected":
      return { message: "This payment is not waiting for a new receipt.", status: 409 };
    case "too_many_resubmissions":
      return { message: "This order already has several new receipts. Please contact the branch.", status: 429 };
    default:
      return { message: "The receipt could not be resubmitted. Please try again.", status: 422 };
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    return NextResponse.json({ error: "The receipt upload is too large." }, { status: 413 });
  }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data")) {
    return NextResponse.json({ error: "Send the receipt as a form upload." }, { status: 415 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "The receipt upload could not be read." }, { status: 400 });
  }

  const orderNumber = textField(form, "orderNumber").trim().toUpperCase();
  if (!/^WEB-[0-9]{12}-[0-9A-F]{6}$/.test(orderNumber)) {
    return NextResponse.json({ error: "Enter the order number from your confirmation." }, { status: 400 });
  }

  const phone = normalizePakistanPhone(textField(form, "phone"));
  if (!phone) {
    return NextResponse.json({ error: "Enter a valid Pakistan mobile number." }, { status: 400 });
  }

  const paymentReference = normalizePaymentReference(textField(form, "paymentReference"));
  if (!/^[A-Z0-9._/-]{3,100}$/.test(paymentReference)) {
    return NextResponse.json({ error: "Enter a valid transfer reference." }, { status: 400 });
  }

  const receiptEntry = form.get("receipt");
  const receipt = receiptEntry instanceof File && receiptEntry.size > 0 ? receiptEntry : null;
  if (!receipt) {
    return NextResponse.json({ error: "Choose a photo of the corrected receipt." }, { status: 400 });
  }
  if (receipt.type !== "image/jpeg" || receipt.size > MAX_RECEIPT_BYTES) {
    return NextResponse.json({ error: "Upload a JPEG receipt no larger than 4 MB." }, { status: 400 });
  }
  const header = new Uint8Array(await receipt.slice(0, 3).arrayBuffer());
  if (header.length !== 3 || header[0] !== 0xff || header[1] !== 0xd8 || header[2] !== 0xff) {
    return NextResponse.json({ error: "The receipt file is not a valid JPEG image." }, { status: 400 });
  }

  const { client, env } = await getServerSupabase();
  if (!client || !env.CHECKOUT_HASH_SECRET || env.CHECKOUT_HASH_SECRET.length < 32) {
    return NextResponse.json({ error: "Receipt resubmission is not configured yet." }, { status: 503 });
  }

  const ipAddress =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const ipHash = await hmacHex(env.CHECKOUT_HASH_SECRET, `resubmit-ip:${ipAddress}`);
  const { error: limitError } = await client
    .schema("storefront")
    .rpc("consume_storefront_resubmit_attempt", { p_ip_hash: ipHash });
  if (limitError) {
    const limited = limitError.message.toLowerCase().includes("too many receipt");
    return NextResponse.json(
      {
        error: limited
          ? "Too many receipt uploads. Please wait before trying again."
          : "Receipt resubmission is unavailable. Please try again later.",
      },
      { status: limited ? 429 : 503 }
    );
  }

  const { data: order, error: orderError } = await client
    .from("web_orders")
    .select("branch_id,status,payment_method,payment_status,payment_review_status")
    .eq("order_number", orderNumber)
    .eq("customer_phone", phone)
    .is("deleted_at", null)
    .maybeSingle();
  if (orderError) {
    return NextResponse.json({ error: "Receipt resubmission is unavailable. Please try again later." }, { status: 503 });
  }
  if (!order) {
    return NextResponse.json({ error: "We could not find that order with this phone number." }, { status: 404 });
  }
  if (!WALLET_METHODS.includes(order.payment_method)) {
    return NextResponse.json({ error: "This order does not need a transfer receipt." }, { status: 422 });
  }
  if (["cancelled", "delivered"].includes(order.status) || order.payment_status === "paid") {
    return NextResponse.json({ error: "This order is closed. Contact the branch for help." }, { status: 409 });
  }
  if (order.payment_review_status !== "rejected") {
    return NextResponse.json({ error: "This payment is not waiting for a new receipt." }, { status: 409 });
  }

  const proofPath = `${order.branch_id}/${orderNumber}/receipt-${crypto.randomUUID()}.jpg`;
  const { error: uploadError } = await client.storage
    .from("web-order-payment-proofs")
    .upload(proofPath, receipt, { contentType: "image/jpeg", cacheControl: "0", upsert: false });
  if (uploadError) {
    return NextResponse.json({ error: "The receipt could not be securely uploaded. Please retry." }, { status: 502 });
  }

  const { data, error: rpcError } = await client
    .schema("storefront")
    .rpc("storefront_resubmit_payment_proof", {
      p_order_number: orderNumber,
      p_customer_phone: phone,
      p_payment_reference: paymentReference,
      p_payment_proof_path: proofPath,
    });

  const failure = rpcError
    ? { message: "The receipt could not be saved. Please try again.", status: 503 }
    : (() => {
        const code =
          typeof data === "object" && data !== null && "error" in data && typeof data.error === "string"
            ? data.error
            : null;
        return code ? publicResubmitError(code) : null;
      })();

  if (failure) {
    const { error: cleanupError } = await client.storage
      .from("web-order-payment-proofs")
      .remove([proofPath]);
    if (cleanupError) {
      return NextResponse.json(
        { error: "The receipt was not saved and cleanup failed. Contact support before retrying." },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: failure.message }, { status: failure.status });
  }

  return NextResponse.json(
    {
      orderNumber,
      paymentStatus: "pending_verification",
      paymentReviewStatus: "awaiting_review",
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
