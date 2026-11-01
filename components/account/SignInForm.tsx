"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { ACCOUNT_FIELD, ACCOUNT_LABEL } from "@/components/account/account-styles";
import { getSupabaseAuthClient, safeRedirectPath } from "@/lib/supabase-auth";

export function SignInForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");
    try {
      const client = await getSupabaseAuthClient();
      if (!client) {
        setError("Account sign-in is not configured yet. Please contact the store.");
        setLoading(false);
        return;
      }
      const result = await client.auth.signInWithPassword({ email, password });
      if (result.error) {
        setError(result.error.message);
        setLoading(false);
        return;
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not connect to the account service.");
      setLoading(false);
      return;
    }

    router.replace(safeRedirectPath(nextPath, "/account"));
    router.refresh();
  }

  async function resendVerification() {
    setError("");
    setNotice("");
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Enter your email address first.");
      return;
    }
    setLoading(true);
    try {
      const client = await getSupabaseAuthClient();
      if (!client) {
        setError("Account sign-in is not configured yet. Please contact the store.");
        return;
      }
      const { error: resendError } = await client.auth.resend({
        type: "signup",
        email: normalizedEmail,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=%2Faccount` },
      });
      if (resendError) setError(resendError.message);
      else setNotice("If this account needs verification, a new email link has been sent.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not connect to the account service.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassCard as="section" padding="lg" className="mx-auto w-full max-w-lg">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent2">Your account</p>
      <h1 className="mt-2 text-3xl font-semibold text-ink">Welcome back</h1>
      <p className="mt-2 text-sm text-muted">Sign in to manage your profile and saved delivery details.</p>

      <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="signin-email" className={ACCOUNT_LABEL}>Email address</label>
          <input id="signin-email" name="email" type="email" required maxLength={254}
            autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className={ACCOUNT_FIELD} />
        </div>
        <div>
          <label htmlFor="signin-password" className={ACCOUNT_LABEL}>Password</label>
          <input id="signin-password" name="password" type="password" required
            autoComplete="current-password" className={ACCOUNT_FIELD} />
        </div>
        {error && <p role="alert" className="rounded-glass-sm border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
        {notice && <p role="status" className="rounded-glass-sm border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-100">{notice}</p>}
        <GlassButton type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </GlassButton>
      </form>

      <button type="button" onClick={resendVerification} disabled={loading}
        className="mt-4 w-full text-center text-sm text-muted underline-offset-4 hover:text-ink hover:underline disabled:opacity-50">
        Resend verification email
      </button>
      <div className="mt-6 flex flex-wrap justify-between gap-3 border-t border-line/10 pt-5 text-sm">
        <Link href="/forgot-password" className="text-accent2 underline-offset-4 hover:underline">Forgot password?</Link>
        <Link href="/sign-up" className="font-semibold text-ink underline-offset-4 hover:underline">Create an account</Link>
      </div>
      <p className="mt-4 text-center text-xs text-muted">
        Prefer not to sign in? You can still place an order as a guest.
      </p>
    </GlassCard>
  );
}
