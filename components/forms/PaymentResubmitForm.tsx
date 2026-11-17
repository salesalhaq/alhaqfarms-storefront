"use client";

import { useState, type FormEvent } from "react";
import { GlassButton } from "@/components/ui/GlassButton";
import { compressReceipt } from "@/lib/receipt-image";

const FIELD =
  "glass-line w-full rounded-glass-sm px-4 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40";
const LABEL = "mb-2 block text-xs font-medium text-muted";

interface PaymentResubmitFormProps {
  orderNumber: string;
  phone: string;
  onSubmitted: () => void;
}

export function PaymentResubmitForm({ orderNumber, phone, onSubmitted }: PaymentResubmitFormProps) {
  const [reference, setReference] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [inputKey, setInputKey] = useState(0);

  async function handleReceiptChange(file: File | undefined) {
    setError(null);
    setReceipt(null);
    if (!file) return;
    try {
      setReceipt(await compressReceipt(file));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not process the receipt.");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    if (!receipt) {
      setError("Choose a photo of the corrected receipt.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const body = new FormData();
      body.set("orderNumber", orderNumber);
      body.set("phone", phone);
      body.set("paymentReference", reference);
      body.set("receipt", receipt, "receipt.jpg");

      const response = await fetch("/api/orders/resubmit", { method: "POST", body });
      const result: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          typeof result === "object" &&
          result !== null &&
          "error" in result &&
          typeof result.error === "string"
            ? result.error
            : "The receipt could not be resubmitted. Please try again.";
        setError(message);
        return;
      }

      setReference("");
      setReceipt(null);
      setInputKey((current) => current + 1);
      onSubmitted();
    } catch {
      setError("Could not reach the order service. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
      <p className="text-sm text-muted">
        Upload a clear photo of the corrected transfer receipt with its transaction ID. Staff will review it again
        before the order moves forward.
      </p>

      <div>
        <label htmlFor="resubmit-reference" className={LABEL}>
          New transaction ID
        </label>
        <input
          id="resubmit-reference"
          value={reference}
          onChange={(event) => setReference(event.target.value)}
          required
          minLength={3}
          maxLength={100}
          autoComplete="off"
          placeholder="e.g. 12345678901"
          className={FIELD}
        />
      </div>

      <div>
        <label htmlFor="resubmit-receipt" className={LABEL}>
          Corrected receipt image
        </label>
        <input
          id="resubmit-receipt"
          key={inputKey}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          onChange={(event) => void handleReceiptChange(event.target.files?.[0])}
          className="block w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-accent/15 file:px-4 file:py-2 file:text-sm file:font-medium file:text-accent"
        />
        <p className="mt-2 text-xs text-muted">
          JPEG, PNG, or WebP. The image is resized and compressed before upload.
        </p>
      </div>

      {error ? (
        <p role="alert" className="rounded-glass-sm border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <GlassButton type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? "Uploading receipt…" : "Upload new receipt"}
      </GlassButton>
    </form>
  );
}
