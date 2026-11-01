"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { ACCOUNT_FIELD, ACCOUNT_LABEL } from "@/components/account/account-styles";
import { getSupabaseAuthClient } from "@/lib/supabase-auth";

export function SignUpForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const fullName = String(form.get("fullName") ?? "").trim();
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const phone = String(form.get("phone") ?? "").trim();
    const whatsapp = String(form.get("whatsapp") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (fullName.length < 2) {
      setError("Enter your full name.");
      setLoading(false);
      return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      setError("Enter a valid phone number with at least 10 digits.");
      setLoading(false);
      return;
    }
    if (password.length < 8) {
      setError("Your password must be at least 8 characters.");
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const client = await getSupabaseAuthClient();
      if (!client) {
        setError("Account registration is not configured yet. Please contact the store.");
        return;
      }
      const { data, error: signUpError } = await client.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, phone, whatsapp },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=%2Faccount`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
      } else if (data.session) {
        router.replace("/account");
        router.refresh();
      } else {
        setNotice("Account created. Check your email and follow the verification link to finish signing in.");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not connect to the account service.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassCard as="section" padding="lg" className="mx-auto w-full max-w-lg">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent2">Join Al-Haq Farms</p>
      <h1 className="mt-2 text-3xl font-semibold text-ink">Create your account</h1>
      <p className="mt-2 text-sm text-muted">Save your contact and delivery details for easier account management.</p>

      {notice ? (
        <div role="status" className="mt-7 rounded-glass-sm border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
          {notice}
          <Link href="/sign-in" className="mt-3 block font-semibold underline underline-offset-4">Continue to sign in</Link>
        </div>
      ) : (
        <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="signup-name" className={ACCOUNT_LABEL}>Full name</label>
            <input id="signup-name" name="fullName" required minLength={2} maxLength={160}
              autoComplete="name" className={ACCOUNT_FIELD} />
          </div>
          <div>
            <label htmlFor="signup-email" className={ACCOUNT_LABEL}>Email address</label>
            <input id="signup-email" name="email" type="email" required maxLength={254}
              autoComplete="email" className={ACCOUNT_FIELD} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="signup-phone" className={ACCOUNT_LABEL}>Phone number</label>
              <input id="signup-phone" name="phone" type="tel" required maxLength={30}
                autoComplete="tel" className={ACCOUNT_FIELD} />
            </div>
            <div>
              <label htmlFor="signup-whatsapp" className={ACCOUNT_LABEL}>WhatsApp (optional)</label>
              <input id="signup-whatsapp" name="whatsapp" type="tel" maxLength={30}
                className={ACCOUNT_FIELD} />
            </div>
          </div>
          <div>
            <label htmlFor="signup-password" className={ACCOUNT_LABEL}>Password (8 characters minimum)</label>
            <input id="signup-password" name="password" type="password" required minLength={8}
              autoComplete="new-password" className={ACCOUNT_FIELD} />
          </div>
          <div>
            <label htmlFor="signup-confirm-password" className={ACCOUNT_LABEL}>Confirm password</label>
            <input id="signup-confirm-password" name="confirmPassword" type="password" required minLength={8}
              autoComplete="new-password" className={ACCOUNT_FIELD} />
          </div>
          {error && <p role="alert" className="rounded-glass-sm border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
          <GlassButton type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </GlassButton>
        </form>
      )}

      <p className="mt-6 border-t border-line/10 pt-5 text-center text-sm text-muted">
        Already have an account? <Link href="/sign-in" className="font-semibold text-ink underline-offset-4 hover:underline">Sign in</Link>
      </p>
    </GlassCard>
  );
}
