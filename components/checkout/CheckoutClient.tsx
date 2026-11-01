"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, LoaderCircle, ShieldCheck } from "lucide-react";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { TurnstileWidget } from "@/components/checkout/TurnstileWidget";
import { useCart } from "@/lib/store";
import { getSupabaseAuthClient } from "@/lib/supabase-auth";
import type { Branch } from "@/lib/types";
import {
  formatPaisa,
  formatQuantity,
} from "@/lib/utils";
import {
  createCheckoutAttemptId,
  normalizePakistanPhone,
  normalizePaymentReference,
  parseRupeesToPaisa,
} from "@/lib/checkout-validation";

const EMPTY_CITIES: string[] = [];

interface PaymentAccount {
  payment_method: "easypaisa" | "jazzcash";
  account_title: string;
  account_number: string;
  instructions: string | null;
  qr_code_data_url: string | null;
}

interface DeliverySetting {
  branch_id: string;
  allowed_cities: string[];
  delivery_charge_paisa: number;
  free_delivery_threshold_paisa: number;
}

interface CodSetting {
  branch_id: string;
  allowed_cities: string[] | null;
  max_order_amount_paisa: number | null;
}

interface QuoteLine {
  productId: string;
  productName: string;
  unitCode: string;
  quantityMilli: number;
  lineTotalPaisa: number;
}

interface OrderQuote {
  subtotalPaisa: number;
  taxPaisa: number;
  deliveryChargePaisa: number;
  totalPaisa: number;
  items: QuoteLine[];
}

interface CheckoutClientProps {
  branches: Branch[];
  defaultBranchId: string;
  paymentAccounts: PaymentAccount[];
  deliverySettings: DeliverySetting[];
  codSettings: CodSetting[];
  isBackendConfigured: boolean;
  turnstileSiteKey: string;
}

const FIELD =
  "glass-line w-full rounded-glass-sm px-4 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40";
const LABEL = "mb-2 block text-xs font-medium text-muted";
const STEPS = ["Branch", "Contact", "Payment", "Transfer", "Review"];

function isAllowedCity(cities: string[] | null, city: string): boolean {
  return Boolean(city) &&
    (cities === null ||
      cities.length === 0 ||
      cities.some((allowed) => allowed.trim().toLowerCase() === city.trim().toLowerCase()));
}

function compressReceipt(file: File): Promise<File> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return Promise.reject(new Error("Choose a JPEG, PNG, or WebP receipt image."));
  }
  if (file.size > 12 * 1024 * 1024) {
    return Promise.reject(new Error("The selected image is too large to process."));
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      if (
        image.naturalWidth > 6000 ||
        image.naturalHeight > 6000 ||
        image.naturalWidth * image.naturalHeight > 40_000_000
      ) {
        reject(new Error("The receipt image dimensions are too large to process."));
        return;
      }
      const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("The receipt image could not be processed."));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("The receipt image could not be compressed."));
            return;
          }
          if (blob.size > 4 * 1024 * 1024) {
            reject(new Error("The compressed receipt must be no larger than 4 MB."));
            return;
          }
          resolve(new File([blob], "receipt.jpg", { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.82
      );
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("The selected file is not a readable image."));
    };
    image.src = objectUrl;
  });
}

export function CheckoutClient({
  branches,
  defaultBranchId,
  paymentAccounts,
  deliverySettings,
  codSettings,
  isBackendConfigured,
  turnstileSiteKey,
}: CheckoutClientProps) {
  const router = useRouter();
  const { items, clearCart } = useCart();
  const [step, setStep] = useState(1);
  const [branchId, setBranchId] = useState(defaultBranchId);
  const [fulfillmentType, setFulfillmentType] = useState<"delivery" | "pickup">("delivery");
  const [city, setCity] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<
    "easypaisa" | "jazzcash" | "cash_on_delivery" | ""
  >("");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState("");
  const [receiptError, setReceiptError] = useState("");
  const [notes, setNotes] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileAttempt, setTurnstileAttempt] = useState(0);
  const [quote, setQuote] = useState<OrderQuote | null>(null);
  const [quoteError, setQuoteError] = useState("");
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const quoteItemsKey = useMemo(
    () => JSON.stringify(items.map(({ productId, quantityMilli }) => ({ productId, quantityMilli }))),
    [items]
  );
  const currentBranch = branches.find((branch) => branch.id === branchId);
  const deliverySetting = deliverySettings.find((setting) => setting.branch_id === branchId);
  const codSetting = codSettings.find((setting) => setting.branch_id === branchId);
  const deliveryCities = deliverySetting?.allowed_cities ?? EMPTY_CITIES;
  const estimatedSubtotalPaisa = items.reduce(
    (total, item) =>
      total + Math.round((item.pricePaisa * item.quantityMilli) / 1000),
    0
  );
  const estimatedDeliveryChargePaisa =
    fulfillmentType === "pickup"
      ? 0
      : deliverySetting && city && deliveryCities.includes(city)
        ? estimatedSubtotalPaisa >= deliverySetting.free_delivery_threshold_paisa
          ? 0
          : deliverySetting.delivery_charge_paisa
        : null;
  const estimatedTotalPaisa =
    estimatedDeliveryChargePaisa === null
      ? null
      : estimatedSubtotalPaisa + estimatedDeliveryChargePaisa;
  const transferAccounts = paymentAccounts.filter(
    (account) => account.payment_method === "easypaisa" || account.payment_method === "jazzcash"
  );
  const availablePaymentMethods = [
    ...transferAccounts.map((account) => account.payment_method),
    ...(fulfillmentType === "delivery" && codSetting ? ["cash_on_delivery" as const] : []),
  ];
  const selectedAccount = paymentAccounts.find(
    (account) => account.payment_method === paymentMethod
  );
  const parsedPaymentAmount = parseRupeesToPaisa(paymentAmount);
  const phoneIsValid = normalizePakistanPhone(customerPhone) !== null;
  const codAvailable = Boolean(
    fulfillmentType === "delivery" &&
      codSetting &&
      quote &&
      quote.totalPaisa > 0 &&
      isAllowedCity(codSetting.allowed_cities, city) &&
      (codSetting.max_order_amount_paisa === null ||
        quote.totalPaisa <= codSetting.max_order_amount_paisa)
  );

  useEffect(() => {
    const existing = window.sessionStorage.getItem("sf:checkout-attempt");
    const key = existing || createCheckoutAttemptId();
    window.sessionStorage.setItem("sf:checkout-attempt", key);
    setIdempotencyKey(key);
  }, []);

  useEffect(() => {
    if (!receipt) {
      setReceiptPreview("");
      return;
    }
    const previewUrl = URL.createObjectURL(receipt);
    setReceiptPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [receipt]);

  useEffect(() => {
    if (!isBackendConfigured || !branchId || items.length === 0) {
      setQuote(null);
      setQuoteError("");
      setQuoteLoading(false);
      return;
    }

    const requestItems = JSON.parse(quoteItemsKey) as Array<{
      productId: string;
      quantityMilli: number;
    }>;
    if (
      fulfillmentType === "delivery" &&
      (!deliverySetting || !city || !deliveryCities.includes(city))
    ) {
      setQuote(null);
      setQuoteError("Choose a delivery city served by this branch.");
      setQuoteLoading(false);
      return;
    }

    const controller = new AbortController();
    setQuote(null);
    setQuoteError("");
    setQuoteLoading(true);
    fetch("/api/checkout/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        branchId,
        fulfillmentType,
        city: fulfillmentType === "delivery" ? city : null,
        items: requestItems,
      }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not calculate the order.");
        setQuote(result as OrderQuote);
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setQuoteError(cause instanceof Error ? cause.message : "Could not calculate the order.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setQuoteLoading(false);
      });

    return () => controller.abort();
  }, [
    branchId,
    city,
    deliveryCities,
    deliverySetting,
    fulfillmentType,
    isBackendConfigured,
    items.length,
    quoteItemsKey,
  ]);

  useEffect(() => {
    if (fulfillmentType !== "delivery" && paymentMethod === "cash_on_delivery") {
      setPaymentMethod("");
    }
  }, [fulfillmentType, paymentMethod]);

  function validateStep(): boolean {
    setError("");
    if (step === 1) {
      if (!currentBranch) {
        setError("Choose a branch.");
        return false;
      }
      if (
        fulfillmentType === "delivery" &&
        (!deliverySetting || !city || !deliveryCities.includes(city))
      ) {
        setError("Choose a delivery city served by this branch, or select pickup.");
        return false;
      }
      if (fulfillmentType === "delivery" && address.trim().length < 5) {
        setError("Enter your delivery address before continuing.");
        return false;
      }
    }
    if (step === 2) {
      if (customerName.trim().length < 2) {
        setError("Enter your name.");
        return false;
      }
      if (!phoneIsValid) {
        setError("Enter a valid Pakistan mobile number, such as 03xx xxxxxxx.");
        return false;
      }
    }
    if (step === 3) {
      if (!paymentMethod || !availablePaymentMethods.includes(paymentMethod)) {
        setError("Choose one of the currently available payment methods.");
        return false;
      }
      if (paymentMethod === "cash_on_delivery" && !codAvailable) {
        setError("Cash on delivery is not available for this city or order total.");
        return false;
      }
    }
    if (step === 4 && paymentMethod !== "cash_on_delivery") {
      if (normalizePaymentReference(paymentReference).length < 3) {
        setError("Enter the transfer reference shown by your payment app.");
        return false;
      }
      if (parsedPaymentAmount === null || !quote || Math.abs(parsedPaymentAmount - quote.totalPaisa) > 1) {
        setError("The transfer amount must match the latest order total.");
        return false;
      }
      if (!receipt) {
        setError("Upload a clear screenshot of the completed transfer.");
        return false;
      }
    }
    return true;
  }

  function continueCheckout() {
    if (validateStep()) setStep((current) => Math.min(5, current + 1));
  }

  async function handleReceiptChange(file: File | undefined) {
    setReceiptError("");
    setReceipt(null);
    if (!file) return;
    try {
      setReceipt(await compressReceipt(file));
    } catch (cause) {
      setReceiptError(cause instanceof Error ? cause.message : "Could not process the receipt.");
    }
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateStep()) return;
    if (
      !currentBranch ||
      (fulfillmentType === "delivery" &&
        (!deliverySetting || !city || !deliveryCities.includes(city) || address.trim().length < 5)) ||
      customerName.trim().length < 2 ||
      !phoneIsValid ||
      !paymentMethod ||
      !availablePaymentMethods.includes(paymentMethod) ||
      (paymentMethod === "cash_on_delivery" && !codAvailable) ||
      (paymentMethod !== "cash_on_delivery" &&
        (!quote ||
          !receipt ||
          !paymentReference ||
          parsedPaymentAmount === null ||
          Math.abs(parsedPaymentAmount - quote.totalPaisa) > 1))
    ) {
      setError("One or more order details changed. Review the checkout steps and try again.");
      return;
    }
    if (!isBackendConfigured || !quote || !idempotencyKey) {
      setError("Online checkout is not ready. Please try again later.");
      return;
    }
    if (!turnstileSiteKey || !turnstileToken) {
      setError("Complete the security check before placing your order.");
      return;
    }

    setSubmitting(true);
    setError("");
    const formData = new FormData();
    formData.set("idempotencyKey", idempotencyKey);
    formData.set("branchId", branchId);
    formData.set("fulfillmentType", fulfillmentType);
    formData.set("city", fulfillmentType === "delivery" ? city : "");
    formData.set("customerName", customerName.trim());
    formData.set("customerPhone", customerPhone);
    formData.set("deliveryAddress", fulfillmentType === "delivery" ? address.trim() : "");
    formData.set("paymentMethod", paymentMethod);
    formData.set("paymentReference", paymentMethod === "cash_on_delivery" ? "" : normalizePaymentReference(paymentReference));
    formData.set("paymentAmountPaisa", paymentMethod === "cash_on_delivery" ? "" : String(parsedPaymentAmount));
    formData.set("notes", notes.trim());
    formData.set("turnstileToken", turnstileToken);
    formData.set("honeypot", honeypot);
    formData.set("items", quoteItemsKey);
    if (receipt && paymentMethod !== "cash_on_delivery") {
      formData.set("receipt", receipt, "receipt.jpg");
    }

    try {
      const headers: Record<string, string> = {};
      const authClient = await getSupabaseAuthClient();
      if (authClient) {
        const { data: authData, error: authError } = await authClient.auth.getSession();
        if (authError) throw new Error("Could not verify your account session. Please try again.");
        if (authData.session) headers.Authorization = `Bearer ${authData.session.access_token}`;
      }
      const response = await fetch("/api/orders", { method: "POST", headers, body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "We could not place the order.");
      window.sessionStorage.removeItem("sf:checkout-attempt");
      clearCart();
      router.push(
        `/order-confirmation?order=${encodeURIComponent(result.orderNumber)}${
          result.cleanupPending ? "&cleanup=1" : ""
        }`
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not place the order. Please retry.");
      setTurnstileToken(null);
      setTurnstileAttempt((attempt) => attempt + 1);
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl py-20 text-center">
        <GlassCard padding="lg">
          <h1 className="text-2xl font-semibold text-ink">Your cart is empty</h1>
          <p className="mt-3 text-sm text-muted">Add products before starting checkout.</p>
          <Link href="/shop" className="mt-6 inline-flex">
            <GlassButton>Browse products</GlassButton>
          </Link>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl py-8">
      <div className="mb-8">
        <Link href="/shop" className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
          <ArrowLeft size={16} aria-hidden="true" />
          Continue shopping
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Checkout</h1>
        <p className="mt-2 text-sm text-muted">Your prices and availability are confirmed by the server.</p>
      </div>

      <ol className="mb-8 grid grid-cols-5 gap-2" aria-label="Checkout progress">
        {STEPS.map((label, index) => {
          const number = index + 1;
          const complete = number < step;
          return (
            <li key={label} className="text-center">
              <span
                className={`mx-auto grid h-8 w-8 place-items-center rounded-full text-xs font-semibold ${
                  number === step || complete ? "bg-accent text-on-accent" : "bg-line/10 text-muted"
                }`}
              >
                {complete ? <CheckCircle2 size={16} /> : number}
              </span>
              <span className={`mt-2 hidden text-xs sm:block ${number === step ? "text-ink" : "text-muted"}`}>
                {label}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <form onSubmit={submitOrder}>
          <GlassCard padding="lg">
            {!isBackendConfigured && (
              <div className="mb-6 rounded-glass-sm border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
                Online ordering is not configured. Add the approved Supabase server settings and apply the proposed migrations to enable checkout.
              </div>
            )}

            {step === 1 && (
              <section aria-labelledby="checkout-branch-heading">
                <h2 id="checkout-branch-heading" className="text-xl font-semibold text-ink">Branch and fulfillment</h2>
                <div className="mt-6 space-y-5">
                  <div>
                    <label className={LABEL} htmlFor="checkout-branch">Pickup or dispatch branch</label>
                    <select id="checkout-branch" className={FIELD} value={branchId} onChange={(event) => {
                      setBranchId(event.target.value);
                      setCity("");
                    }}>
                      <option value="">Choose a branch</option>
                      {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
                    </select>
                    {currentBranch?.address && <p className="mt-2 text-xs text-muted">{currentBranch.address}</p>}
                  </div>
                  <fieldset>
                    <legend className={LABEL}>How would you like to receive your order?</legend>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {(["delivery", "pickup"] as const).map((type) => (
                        <button key={type} type="button" onClick={() => setFulfillmentType(type)}
                          className={`rounded-glass-sm border p-4 text-left transition-colors ${fulfillmentType === type ? "border-accent bg-accent/10" : "border-line/10 hover:border-line/30"}`}>
                          <span className="font-medium capitalize text-ink">{type === "delivery" ? "Home delivery" : "Branch pickup"}</span>
                          <span className="mt-1 block text-xs text-muted">{type === "delivery" ? "Available areas depend on the selected branch." : "Collect your order from the selected branch."}</span>
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  {fulfillmentType === "delivery" && (
                    <>
                      <div>
                        <label className={LABEL} htmlFor="checkout-city">Delivery city</label>
                        <select id="checkout-city" className={FIELD} value={city} onChange={(event) => setCity(event.target.value)} disabled={!deliveryCities.length}>
                          <option value="">{deliveryCities.length ? "Choose a served city" : "Delivery is not configured for this branch"}</option>
                          {deliveryCities.map((name) => <option key={name} value={name}>{name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={LABEL} htmlFor="checkout-address">Complete delivery address</label>
                        <textarea id="checkout-address" className={FIELD} rows={3} autoComplete="street-address"
                          maxLength={350} placeholder="House, street, area, and a nearby landmark" value={address} onChange={(event) => setAddress(event.target.value)} />
                      </div>
                    </>
                  )}
                  {fulfillmentType === "pickup" && currentBranch && (
                    <div className="rounded-glass-sm bg-line/[0.04] p-4 text-sm text-muted">
                      Pickup location: <span className="font-medium text-ink">{currentBranch.address || currentBranch.name}</span>
                    </div>
                  )}
                </div>
              </section>
            )}

            {step === 2 && (
              <section aria-labelledby="checkout-contact-heading">
                <h2 id="checkout-contact-heading" className="text-xl font-semibold text-ink">Your contact details</h2>
                <p className="mt-2 text-sm text-muted">We use your mobile number to confirm this order.</p>
                <div className="mt-6 space-y-5">
                  <div>
                    <label className={LABEL} htmlFor="checkout-name">Full name</label>
                    <input id="checkout-name" className={FIELD} autoComplete="name" required maxLength={160} value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
                  </div>
                  <div>
                    <label className={LABEL} htmlFor="checkout-phone">Pakistan mobile number</label>
                    <input id="checkout-phone" className={FIELD} type="tel" inputMode="tel" autoComplete="tel"
                      placeholder="03xx xxxxxxx" required value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} />
                    {customerPhone && <p className="mt-2 text-xs text-muted">{phoneIsValid ? `Saved as ${normalizePakistanPhone(customerPhone)}` : "Enter a valid Pakistan mobile number."}</p>}
                  </div>
                  {fulfillmentType === "pickup" && (
                    <p className="rounded-glass-sm bg-line/[0.04] p-4 text-sm text-muted">Order pickup is at {currentBranch?.name ?? "your selected branch"}.</p>
                  )}
                </div>
              </section>
            )}

            {step === 3 && (
              <section aria-labelledby="checkout-payment-heading">
                <h2 id="checkout-payment-heading" className="text-xl font-semibold text-ink">Choose a payment method</h2>
                <p className="mt-2 text-sm text-muted">Only methods configured for this storefront are shown.</p>
                <div className="mt-6 space-y-3">
                  {transferAccounts.map((account) => (
                    <label key={account.payment_method} className={`flex cursor-pointer items-start gap-3 rounded-glass-sm border p-4 ${paymentMethod === account.payment_method ? "border-accent bg-accent/10" : "border-line/10"}`}>
                      <input type="radio" name="payment-method" value={account.payment_method} checked={paymentMethod === account.payment_method}
                        onChange={() => setPaymentMethod(account.payment_method)} className="mt-1 accent-accent" />
                      <span>
                        <span className="block font-medium capitalize text-ink">{account.payment_method}</span>
                        <span className="mt-1 block text-xs text-muted">Transfer first, then provide the reference and receipt.</span>
                      </span>
                    </label>
                  ))}
                  {fulfillmentType === "delivery" && codSetting && (
                    <label className={`flex cursor-pointer items-start gap-3 rounded-glass-sm border p-4 ${paymentMethod === "cash_on_delivery" ? "border-accent bg-accent/10" : "border-line/10"} ${!codAvailable ? "opacity-60" : ""}`}>
                      <input type="radio" name="payment-method" value="cash_on_delivery" checked={paymentMethod === "cash_on_delivery"}
                        onChange={() => setPaymentMethod("cash_on_delivery")} className="mt-1 accent-accent" />
                      <span>
                        <span className="block font-medium text-ink">Cash on delivery</span>
                        <span className="mt-1 block text-xs text-muted">
                          {quote && codSetting.max_order_amount_paisa !== null
                            ? `Limit ${formatPaisa(codSetting.max_order_amount_paisa)}; final availability depends on your city and total.`
                            : "Available only for eligible delivery areas and order totals."}
                        </span>
                      </span>
                    </label>
                  )}
                  {availablePaymentMethods.length === 0 && (
                    <p className="rounded-glass-sm bg-line/[0.04] p-4 text-sm text-muted">No payment methods are configured yet.</p>
                  )}
                </div>
                {paymentMethod === "cash_on_delivery" && quote && !codAvailable && (
                  <p className="mt-3 text-sm text-amber-200">COD is not available for the selected city or order total.</p>
                )}
              </section>
            )}

            {step === 4 && (
              <section aria-labelledby="checkout-transfer-heading">
                <h2 id="checkout-transfer-heading" className="text-xl font-semibold text-ink">Transfer and receipt</h2>
                {paymentMethod === "cash_on_delivery" ? (
                  <div className="mt-5 rounded-glass-sm bg-line/[0.04] p-4 text-sm text-muted">
                    You selected cash on delivery. No transfer or receipt is required. Please keep your phone available to confirm the order.
                  </div>
                ) : selectedAccount ? (
                  <div className="mt-5 space-y-5">
                    <div className="rounded-glass-sm bg-line/[0.04] p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted">{selectedAccount.payment_method} account</p>
                      <p className="mt-2 text-sm font-semibold text-ink">{selectedAccount.account_title}</p>
                      <p className="mt-1 select-all text-sm text-ink">{selectedAccount.account_number}</p>
                      {selectedAccount.instructions && <p className="mt-3 whitespace-pre-line text-xs text-muted">{selectedAccount.instructions}</p>}
                      {selectedAccount.qr_code_data_url && /^data:image\/(?:png|jpeg|webp);base64,/i.test(selectedAccount.qr_code_data_url) && (
                        <img src={selectedAccount.qr_code_data_url} alt={`${selectedAccount.payment_method} payment QR code`} className="mt-4 h-40 w-40 rounded-lg bg-white object-contain p-2" />
                      )}
                    </div>
                    <div>
                      <label className={LABEL} htmlFor="checkout-reference">Transfer reference / transaction ID</label>
                      <input id="checkout-reference" className={FIELD} autoComplete="off" maxLength={150} value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} />
                    </div>
                    <div>
                      <label className={LABEL} htmlFor="checkout-amount">Amount transferred (Rs)</label>
                      <input id="checkout-amount" className={FIELD} inputMode="decimal" placeholder="0.00" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} />
                      {quote && <p className="mt-2 text-xs text-muted">Amount due: {formatPaisa(quote.totalPaisa, { decimals: true })}</p>}
                    </div>
                    <div>
                      <label className={LABEL} htmlFor="checkout-receipt">Transfer screenshot (JPEG, PNG, or WebP)</label>
                      <input ref={inputRef} id="checkout-receipt" className={`${FIELD} file:mr-3 file:rounded-full file:border-0 file:bg-accent/15 file:px-3 file:py-2 file:text-xs file:font-medium file:text-ink`}
                        type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void handleReceiptChange(event.target.files?.[0])} />
                      <p className="mt-2 text-xs text-muted">The image is resized and compressed before secure upload. Maximum final size: 4 MB.</p>
                      {receiptError && <p role="alert" className="mt-2 text-xs text-red-300">{receiptError}</p>}
                      {receiptPreview && <img src={receiptPreview} alt="Selected transfer receipt preview" className="mt-3 max-h-56 rounded-lg border border-line/10 object-contain" />}
                    </div>
                  </div>
                ) : (
                  <p className="mt-5 text-sm text-muted">Go back and select an available payment method.</p>
                )}
              </section>
            )}

            {step === 5 && (
              <section aria-labelledby="checkout-review-heading">
                <h2 id="checkout-review-heading" className="text-xl font-semibold text-ink">Review your order</h2>
                <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
                  <div><dt className="text-muted">Branch</dt><dd className="mt-1 font-medium text-ink">{currentBranch?.name}</dd></div>
                  <div><dt className="text-muted">Fulfillment</dt><dd className="mt-1 font-medium capitalize text-ink">{fulfillmentType}</dd></div>
                  {fulfillmentType === "delivery" && <div><dt className="text-muted">City</dt><dd className="mt-1 font-medium text-ink">{city}</dd></div>}
                  <div><dt className="text-muted">Customer</dt><dd className="mt-1 font-medium text-ink">{customerName} · {normalizePakistanPhone(customerPhone)}</dd></div>
                  <div><dt className="text-muted">Payment</dt><dd className="mt-1 font-medium capitalize text-ink">{paymentMethod.replace(/_/g, " ")}</dd></div>
                  {fulfillmentType === "delivery" && <div className="sm:col-span-2"><dt className="text-muted">Address</dt><dd className="mt-1 font-medium text-ink">{address}</dd></div>}
                  {paymentMethod !== "cash_on_delivery" && <div><dt className="text-muted">Transfer reference</dt><dd className="mt-1 break-all font-medium text-ink">{paymentReference}</dd></div>}
                </dl>
                <div className="mt-6">
                  <label className={LABEL} htmlFor="checkout-notes">Order notes (optional)</label>
                  <textarea id="checkout-notes" className={FIELD} rows={3} maxLength={500} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Any useful instructions for preparing your order?" />
                </div>
                <div className="mt-6 rounded-glass-sm bg-line/[0.04] p-4">
                  <p className="flex items-center gap-2 text-sm font-medium text-ink"><ShieldCheck size={17} className="text-accent" /> Security verification</p>
                  {turnstileSiteKey ? <TurnstileWidget key={turnstileAttempt} siteKey={turnstileSiteKey} onToken={setTurnstileToken} /> : (
                    <p className="mt-2 text-xs text-amber-200">Turnstile is not configured. Checkout will remain unavailable until configured.</p>
                  )}
                </div>
              </section>
            )}

            {error && <p role="alert" className="mt-6 rounded-glass-sm border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
            {quoteError && <p role="alert" className="mt-4 text-sm text-amber-200">{quoteError}</p>}
            <div className="mt-8 flex items-center justify-between gap-3 border-t border-line/10 pt-6">
              <GlassButton variant="ghost" onClick={() => { setError(""); setStep((current) => Math.max(1, current - 1)); }} disabled={step === 1 || submitting}>
                <ArrowLeft size={16} /> Back
              </GlassButton>
              {step < 5 ? (
                <GlassButton onClick={continueCheckout} disabled={quoteLoading && step >= 3}>
                  Continue <ArrowRight size={16} />
                </GlassButton>
              ) : (
                <GlassButton type="submit" disabled={submitting || !quote || quoteLoading || !isBackendConfigured || !turnstileToken || (paymentMethod !== "cash_on_delivery" && !receipt)}>
                  {submitting ? <><LoaderCircle size={16} className="animate-spin" /> Placing order</> : <>Place order <ArrowRight size={16} /></>}
                </GlassButton>
              )}
            </div>
            <input aria-hidden="true" tabIndex={-1} autoComplete="off" className="absolute -left-[10000px] h-px w-px opacity-0" name="website" value={honeypot} onChange={(event) => setHoneypot(event.target.value)} />
          </GlassCard>
        </form>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <GlassCard padding="lg">
            <h2 className="text-lg font-semibold text-ink">Order summary</h2>
            <div className="mt-5 space-y-4">
              {items.map((item) => {
                const serverLine = quote?.items.find((line) => line.productId === item.productId);
                const lineTotalPaisa =
                  serverLine?.lineTotalPaisa ??
                  Math.round((item.pricePaisa * item.quantityMilli) / 1000);
                return (
                  <div key={item.productId} className="flex items-start gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-line/10">
                      {item.imagePath ? <Image src={item.imagePath} alt="" fill className="object-cover" /> : <span className="grid h-full place-items-center text-sm font-semibold text-muted">{item.name.charAt(0)}</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-medium text-ink">{item.name}</p>
                      <p className="mt-1 text-xs text-muted">{formatQuantity(item.quantityMilli, item.unitCode)}</p>
                    </div>
                    <span className="text-sm font-medium text-ink">{formatPaisa(lineTotalPaisa)}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 space-y-3 border-t border-line/10 pt-5 text-sm">
              {quoteLoading && <p className="flex items-center gap-2 text-xs text-muted"><LoaderCircle size={14} className="animate-spin" />Updating secure quote…</p>}
              <div className="flex justify-between text-muted"><span>{quote ? "Subtotal" : "Estimated subtotal"}</span><span>{formatPaisa(quote?.subtotalPaisa ?? estimatedSubtotalPaisa)}</span></div>
              <div className="flex justify-between text-muted"><span>Tax included</span><span>{quote ? formatPaisa(quote.taxPaisa) : "Included"}</span></div>
              <div className="flex justify-between text-muted"><span>Delivery</span><span>{quote ? (quote.deliveryChargePaisa ? formatPaisa(quote.deliveryChargePaisa) : "Free / pickup") : estimatedDeliveryChargePaisa === null ? "Select a city" : estimatedDeliveryChargePaisa ? formatPaisa(estimatedDeliveryChargePaisa) : "Free / pickup"}</span></div>
              <div className="flex justify-between border-t border-line/10 pt-3 text-base font-semibold text-ink"><span>{quote ? "Total" : "Estimated total"}</span><span>{quote ? formatPaisa(quote.totalPaisa) : estimatedTotalPaisa === null ? "Select a city" : formatPaisa(estimatedTotalPaisa)}</span></div>
            </div>
            <p className="mt-5 text-xs leading-relaxed text-muted">{quote ? "The server recalculates prices and stock when your order is submitted. The displayed quote may change if products or delivery options change." : "These amounts use the prices saved in your cart and are estimates until the server confirms the order."}</p>
          </GlassCard>
        </aside>
      </div>
    </div>
  );
}
