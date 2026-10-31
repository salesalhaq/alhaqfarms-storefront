import { z } from "zod";

export const trackOrderRequestSchema = z.object({
  orderNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^WEB-[0-9]{12}-[0-9A-F]{6}$/, "Enter the order number from your confirmation."),
  phone: z.string().trim().min(7).max(30),
});

export const trackOrderResultSchema = z.object({
  orderNumber: z.string(),
  status: z.string(),
  fulfillmentType: z.string(),
  paymentStatus: z.string(),
  totalPaisa: z.number().int().nonnegative(),
  createdAt: z.string(),
  branchName: z.string().nullable(),
  items: z.array(
    z.object({
      productName: z.string(),
      unitCode: z.string(),
      quantityMilli: z.number().int().positive(),
      unitPricePaisa: z.number().int().nonnegative(),
      lineTotalPaisa: z.number().int().nonnegative(),
    })
  ),
  events: z.array(
    z.object({
      eventType: z.string(),
      previousStatus: z.string().nullable(),
      nextStatus: z.string().nullable(),
      occurredAt: z.string(),
    })
  ),
});

export type TrackedOrder = z.infer<typeof trackOrderResultSchema>;
