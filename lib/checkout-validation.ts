import { z } from "zod";

export const checkoutItemsSchema = z
  .array(
    z.object({
      productId: z.string().uuid(),
      quantityMilli: z.number().int().min(1).max(999_999_999),
    })
  )
  .min(1)
  .max(50)
  .superRefine((items, context) => {
    const seen = new Set<string>();
    items.forEach((item, index) => {
      if (seen.has(item.productId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index, "productId"],
          message: "Each product may only appear once.",
        });
      }
      seen.add(item.productId);
    });
  });

export const quoteRequestSchema = z.object({
  branchId: z.string().uuid(),
  fulfillmentType: z.enum(["delivery", "pickup"]),
  city: z.string().trim().max(120).optional().nullable(),
  items: checkoutItemsSchema,
});

export const orderRequestSchema = z.object({
  idempotencyKey: z.string().uuid(),
  branchId: z.string().uuid(),
  fulfillmentType: z.enum(["delivery", "pickup"]),
  city: z.string().trim().max(120).optional(),
  customerName: z.string().trim().min(2).max(160),
  customerPhone: z.string().trim().min(7).max(30),
  deliveryAddress: z.string().trim().max(500).optional(),
  paymentMethod: z.enum(["easypaisa", "jazzcash", "cash_on_delivery"]),
  paymentReference: z.string().trim().max(150).optional(),
  paymentAmountPaisa: z.coerce.number().int().nonnegative().safe().optional(),
  notes: z.string().trim().max(500).optional(),
  turnstileToken: z.string().max(2048).optional(),
  honeypot: z.string().max(200).optional(),
  items: checkoutItemsSchema,
});

export function createCheckoutAttemptId(): string {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function normalizePakistanPhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  const national = digits.startsWith("0092")
    ? digits.slice(4)
    : digits.startsWith("92")
      ? digits.slice(2)
      : digits.startsWith("0")
        ? digits.slice(1)
        : digits;

  return /^3\d{9}$/.test(national) ? `+92${national}` : null;
}

export function normalizePaymentReference(value: string): string {
  return value.replace(/[#\s]/g, "").toUpperCase();
}

export function parseRupeesToPaisa(value: string): number | null {
  const match = /^(\d{1,10})(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) return null;

  const rupees = Number(match[1]);
  const paisa = Number((match[2] ?? "").padEnd(2, "0"));
  const total = rupees * 100 + paisa;
  return Number.isSafeInteger(total) ? total : null;
}
