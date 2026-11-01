"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { getSupabaseAuthClient, safeRedirectPath } from "@/lib/supabase-auth";

const callbackExchanges = new Map<string, Promise<string | null>>();

export function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const destination = safeRedirectPath(params.get("next"), "/account");
    async function completeSignIn() {
      if (!code) {
        if (active) setError(params.get("error_description") ?? "This sign-in link is invalid or has expired.");
        return;
      }
      try {
        const client = await getSupabaseAuthClient();
        if (!client) {
          setError("Account sign-in is not configured yet. Please contact the store.");
          return;
        }
        let exchange = callbackExchanges.get(code);
        if (!exchange) {
          exchange = client.auth.exchangeCodeForSession(code).then(({ error: exchangeError }) =>
            exchangeError?.message ?? null
          );
          callbackExchanges.set(code, exchange);
        }
        const exchangeError = await exchange;
        if (!active) return;
        if (exchangeError) {
          setError(exchangeError);
          return;
        }
        router.replace(destination);
        router.refresh();
      } catch (cause) {
        if (active) {
          setError(cause instanceof Error ? cause.message : "We could not connect to the account service.");
        }
      }
    }

    void completeSignIn();
    return () => { active = false; };
  }, [router]);

  return (
    <GlassCard as="section" padding="lg" className="mx-auto w-full max-w-lg text-center">
      {error ? (
        <>
          <h1 className="text-2xl font-semibold text-ink">We couldn’t verify that link</h1>
          <p role="alert" className="mt-4 text-sm text-red-200">{error}</p>
          <a href="/sign-in" className="mt-6 inline-block text-sm text-accent2 underline">Return to sign in</a>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-semibold text-ink">Verifying your account…</h1>
          <p className="mt-2 text-sm text-muted">Please wait while we securely finish signing you in.</p>
        </>
      )}
    </GlassCard>
  );
}
