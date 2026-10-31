import type { Metadata } from "next";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { getCatalogSnapshot } from "@/lib/catalog";
import { getServerEnvironment } from "@/lib/server-supabase";
import { CatalogPreviewNotice } from "@/components/ui/CatalogPreviewNotice";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Choose delivery or pickup and place your Al-Haq Farms order.",
};

interface PaymentAccountRow {
  payment_method: "easypaisa" | "jazzcash";
  account_title: string;
  account_number: string;
  instructions: string | null;
  qr_code_data_url: string | null;
}

interface DeliverySettingRow {
  branch_id: string;
  allowed_cities: string[];
  delivery_charge_paisa: number;
  free_delivery_threshold_paisa: number;
}

interface CodSettingRow {
  branch_id: string;
  allowed_cities: string[] | null;
  max_order_amount_paisa: number | null;
}

export default async function CheckoutPage() {
  const [catalog, env] = await Promise.all([
    getCatalogSnapshot(),
    getServerEnvironment(),
  ]);
  let paymentAccounts: PaymentAccountRow[] = [];
  let deliverySettings: DeliverySettingRow[] = [];
  let codSettings: CodSettingRow[] = [];

  if (isSupabaseConfigured && !catalog.isSample) {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase is configured but its client is unavailable.");

    const [payments, delivery, cod] = await Promise.all([
      supabase
        .schema("storefront")
        .from("storefront_payment_accounts_view")
        .select("payment_method,account_title,account_number,instructions,qr_code_data_url"),
      supabase
        .schema("storefront")
        .from("storefront_delivery_settings_view")
        .select("branch_id,allowed_cities,delivery_charge_paisa,free_delivery_threshold_paisa"),
      supabase
        .schema("storefront")
        .from("storefront_cod_settings_view")
        .select("branch_id,allowed_cities,max_order_amount_paisa"),
    ]);

    if (payments.error) throw new Error(`Could not load payment options: ${payments.error.message}`);
    if (delivery.error) throw new Error(`Could not load delivery options: ${delivery.error.message}`);
    if (cod.error) throw new Error(`Could not load COD options: ${cod.error.message}`);
    paymentAccounts = (payments.data ?? []) as PaymentAccountRow[];
    deliverySettings = (delivery.data ?? []) as DeliverySettingRow[];
    codSettings = (cod.data ?? []) as CodSettingRow[];
  }

  return (
    <main className="px-4 pb-20 pt-4">
      {catalog.isSample && <CatalogPreviewNotice />}
      <CheckoutClient
        branches={catalog.branches}
        defaultBranchId={catalog.branchId}
        paymentAccounts={paymentAccounts}
        deliverySettings={deliverySettings}
        codSettings={codSettings}
        isBackendConfigured={isSupabaseConfigured && !catalog.isSample}
        turnstileSiteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""}
      />
    </main>
  );
}
