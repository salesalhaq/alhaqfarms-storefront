import type { Metadata } from "next";
import { SignInForm } from "@/components/account/SignInForm";
import { safeRedirectPath } from "@/lib/supabase-auth";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Al-Haq Farms account.",
};

interface SignInPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { next } = await searchParams;
  return (
    <main className="px-4 pb-20 pt-4">
      <SignInForm nextPath={safeRedirectPath(next ?? null)} />
    </main>
  );
}
