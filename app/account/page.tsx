import type { Metadata } from "next";
import { AccountPanel } from "@/components/account/AccountPanel";
import { getBrandSettings } from "@/lib/brand-server";

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrandSettings();
  return {
    title: "My account",
    description: `Manage your ${brand.businessName} account and saved delivery details.`,
  };
}

export default function AccountPage() {
  return (
    <main className="px-4 pb-20 pt-4">
      <AccountPanel />
    </main>
  );
}
