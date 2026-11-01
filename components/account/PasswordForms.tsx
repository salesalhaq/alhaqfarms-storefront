"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { ACCOUNT_FIELD, ACCOUNT_LABEL } from "@/components/account/account-styles";
import { getSupabaseAuthClient } from "@/lib/supabase-auth";

export function ForgotPasswordForm() {
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
    try {
      const client = await getSupabaseAuthClient();
      if (!client) {
        setError("Password recovery is not configured yet. Please contact the store.");
        return;
      }
      const { error: resetError } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=%2Freset-password`,
      });

      if (resetError) setError(resetError.message);
      else setNotice("If an account exists for this email, a password reset link will be sent.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not connect to the account service.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassCard as="section" padding="lg" className="mx-auto w-full max-w-lg">
      <h1 className="text-3xl font-semibold text-ink">Reset your password</h1>
      <p className="mt-2 text-sm text-muted">We’ll send a secure password reset link to your email.</p>
      {notice ? (
        <p role="status" className="mt-6 rounded-glass-sm border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">{notice}</p>
      ) : (
        <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="reset-email" className={ACCOUNT_LABEL}>Email address</label>
            <input id="reset-email" name="email" type="email" required maxLength={254}
              autoComplete="email" className={ACCOUNT_FIELD} />
          </div>
          {error && <p role="alert" className="rounded-glass-sm border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
          <GlassButton type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending…" : "Send reset link"}
          </GlassButton>
        </form>
      )}
      <Link href="/sign-in" className="mt-6 block text-center text-sm text-accent2 underline-offset-4 hover:underline">Back to sign in</Link>
    </GlassCard>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    async function checkSession() {
      try {
        const client = await getSupabaseAuthClient();
        if (!active) return;
        if (!client) {
          setError("Password recovery is not configured yet. Please contact the store.");
          return;
        }
        const { data, error: sessionError } = await client.auth.getSession();
        if (!active) return;
        if (sessionError) setError(sessionError.message);
        else if (!data.session) setError("This reset link is invalid or has expired. Request a new one.");
        else setReady(true);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "We could not connect to the account service.");
      }
    }

    void checkSession();

    return () => { active = false; };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmation = String(form.get("confirmation") ?? "");
    if (password.length < 8) {
      setError("Your password must be at least 8 characters.");
      return;
    }
    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const client = await getSupabaseAuthClient();
      if (!client) {
        setError("Password recovery is not configured yet. Please contact the store.");
        return;
      }
      const { error: updateError } = await client.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      setNotice("Your password has been updated. Taking you to your account…");
      router.replace("/account");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not connect to the account service.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassCard as="section" padding="lg" className="mx-auto w-full max-w-lg">
      <h1 className="text-3xl font-semibold text-ink">Choose a new password</h1>
      <p className="mt-2 text-sm text-muted">Use at least 8 characters.</p>
      {ready && (
        <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="new-password" className={ACCOUNT_LABEL}>New password</label>
            <input id="new-password" name="password" type="password" required minLength={8}
              autoComplete="new-password" className={ACCOUNT_FIELD} />
          </div>
          <div>
            <label htmlFor="confirm-new-password" className={ACCOUNT_LABEL}>Confirm new password</label>
            <input id="confirm-new-password" name="confirmation" type="password" required minLength={8}
              autoComplete="new-password" className={ACCOUNT_FIELD} />
          </div>
          {error && <p role="alert" className="rounded-glass-sm border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
          {notice && <p role="status" className="text-sm text-emerald-200">{notice}</p>}
          <GlassButton type="submit" className="w-full" disabled={loading}>
            {loading ? "Updating…" : "Update password"}
          </GlassButton>
        </form>
      )}
      {!ready && error && <p role="alert" className="mt-6 rounded-glass-sm border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
      {!ready && error.includes("expired") && (
        <Link href="/forgot-password" className="mt-4 block text-center text-sm text-accent2 underline">Request a new link</Link>
      )}
    </GlassCard>
  );
}
