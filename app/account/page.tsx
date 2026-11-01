import type { Metadata } from "next";
import { AccountPanel } from "@/components/account/AccountPanel";

export const metadata: Metadata = {
  title: "My account",
  description: "Manage your Al-Haq Farms account and saved delivery details.",
};

export default function AccountPage() {
  return (
    <main className="px-4 pb-20 pt-4">
      <AccountPanel />
    </main>
  );
}
