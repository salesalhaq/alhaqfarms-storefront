import type { Metadata } from "next";
import { AuthCallback } from "@/components/account/AuthCallback";

export const metadata: Metadata = {
  title: "Verifying account",
  robots: { index: false, follow: false },
};

export default function AuthCallbackPage() {
  return (
    <main className="px-4 pb-20 pt-4">
      <AuthCallback />
    </main>
  );
}
