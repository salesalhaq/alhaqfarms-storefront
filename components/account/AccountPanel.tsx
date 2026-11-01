"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Heart, LogOut, PackageCheck, UserRound } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { ACCOUNT_FIELD, ACCOUNT_LABEL } from "@/components/account/account-styles";
import { CustomerOrderHistory } from "@/components/account/CustomerOrderHistory";
import { CustomerWishlist } from "@/components/account/CustomerWishlist";
import { getSupabaseAuthClient } from "@/lib/supabase-auth";

function metadataText(user: User, key: string): string {
  const value = user.user_metadata?.[key];
  return typeof value === "string" ? value : "";
}

export function AccountPanel() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "wishlist" | "orders">("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | null = null;
    async function initialize() {
      try {
        const client = await getSupabaseAuthClient();
        if (!active) return;
        if (!client) {
          setError("Account service is not configured yet. Please contact the store.");
          setLoading(false);
          return;
        }

        const { data: authListener } = client.auth.onAuthStateChange((_event, session) => {
          if (!active) return;
          if (session) setUser(session.user);
          else router.replace("/sign-in?next=%2Faccount");
        });
        unsubscribe = () => authListener.subscription.unsubscribe();

        const { data, error: sessionError } = await client.auth.getSession();
        if (!active) return;
        if (sessionError) {
          setError(sessionError.message);
          setLoading(false);
        } else if (!data.session) {
          router.replace("/sign-in?next=%2Faccount");
        } else {
          setUser(data.session.user);
          setLoading(false);
        }
      } catch (cause) {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : "We could not connect to the account service.");
        setLoading(false);
      }
    }

    void initialize();

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [router]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    const form = new FormData(event.currentTarget);
    const fullName = String(form.get("fullName") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    const whatsapp = String(form.get("whatsapp") ?? "").trim();
    const deliveryAddress = String(form.get("deliveryAddress") ?? "").trim();
    if (fullName.length < 2) {
      setError("Enter your full name.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      setError("Enter a valid phone number with at least 10 digits.");
      return;
    }

    setSaving(true);
    try {
      const client = await getSupabaseAuthClient();
      if (!client) {
        setError("Account service is not configured yet. Please contact the store.");
        return;
      }
      const { data, error: updateError } = await client.auth.updateUser({
        data: { full_name: fullName, phone, whatsapp, delivery_address: deliveryAddress },
      });
      if (updateError) {
        setError(updateError.message);
      } else {
        setUser(data.user);
        setNotice("Your account details have been saved.");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not connect to the account service.");
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    setError("");
    setSigningOut(true);
    try {
      const client = await getSupabaseAuthClient();
      if (!client) {
        setError("Account service is not configured yet. Please contact the store.");
        setSigningOut(false);
        return;
      }
      const { error: signOutError } = await client.auth.signOut();
      if (signOutError) {
        setError(signOutError.message);
        setSigningOut(false);
        return;
      }
      router.replace("/");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not connect to the account service.");
      setSigningOut(false);
    }
  }

  if (loading) {
    return (
      <GlassCard as="section" padding="lg" className="mx-auto w-full max-w-3xl">
        <p className="text-sm text-muted" role="status">Loading your account…</p>
      </GlassCard>
    );
  }

  if (!user) {
    return (
      <GlassCard as="section" padding="lg" className="mx-auto w-full max-w-3xl">
        <p role="alert" className="text-sm text-red-200">{error || "Please sign in to view your account."}</p>
      </GlassCard>
    );
  }

  const createdLabel = user.created_at
    ? new Intl.DateTimeFormat("en-PK", { month: "long", year: "numeric" }).format(new Date(user.created_at))
    : "Member";

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <GlassCard as="section" padding="lg" className="flex flex-wrap items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-accent/15 text-accent">
            <UserRound size={25} aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent2">My account</p>
            <h1 className="mt-1 text-2xl font-semibold text-ink">{metadataText(user, "full_name") || "Welcome"}</h1>
            <p className="mt-1 text-sm text-muted">{user.email} · Member since {createdLabel}</p>
          </div>
        </div>
        <GlassButton variant="secondary" onClick={signOut} disabled={signingOut}>
          <LogOut size={16} aria-hidden="true" />
          {signingOut ? "Signing out…" : "Sign out"}
        </GlassButton>
      </GlassCard>

      <nav aria-label="Account sections" className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setActiveTab("profile")} aria-pressed={activeTab === "profile"}
          className={`rounded-full border px-4 py-2 text-sm font-medium ${activeTab === "profile" ? "border-accent bg-accent text-on-accent" : "border-line/15 text-muted hover:text-ink"}`}>
          Profile
        </button>
        <button type="button" onClick={() => setActiveTab("wishlist")} aria-pressed={activeTab === "wishlist"}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${activeTab === "wishlist" ? "border-accent bg-accent text-on-accent" : "border-line/15 text-muted hover:text-ink"}`}>
          <Heart size={15} aria-hidden="true" /> Wishlist
        </button>
        <button type="button" onClick={() => setActiveTab("orders")} aria-pressed={activeTab === "orders"}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${activeTab === "orders" ? "border-accent bg-accent text-on-accent" : "border-line/15 text-muted hover:text-ink"}`}>
          <PackageCheck size={15} aria-hidden="true" /> Order history
        </button>
      </nav>

      {activeTab === "profile" && <GlassCard as="section" padding="lg">
        <h2 className="text-xl font-semibold text-ink">Personal and delivery details</h2>
        <p className="mt-1 text-sm text-muted">Keep your contact information and preferred delivery address up to date.</p>
        {error && <p role="alert" className="mt-5 rounded-glass-sm border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
        {notice && <p role="status" className="mt-5 rounded-glass-sm border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-100">{notice}</p>}
        <form className="mt-6 space-y-5" onSubmit={saveProfile}>
          <div>
            <label htmlFor="account-email" className={ACCOUNT_LABEL}>Email address</label>
            <input id="account-email" type="email" value={user.email ?? ""} readOnly
              className={`${ACCOUNT_FIELD} cursor-not-allowed opacity-70`} />
          </div>
          <div>
            <label htmlFor="account-name" className={ACCOUNT_LABEL}>Full name</label>
            <input id="account-name" name="fullName" required minLength={2} maxLength={160}
              defaultValue={metadataText(user, "full_name")} autoComplete="name" className={ACCOUNT_FIELD} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="account-phone" className={ACCOUNT_LABEL}>Phone number</label>
              <input id="account-phone" name="phone" type="tel" required maxLength={30}
                defaultValue={metadataText(user, "phone")} autoComplete="tel" className={ACCOUNT_FIELD} />
            </div>
            <div>
              <label htmlFor="account-whatsapp" className={ACCOUNT_LABEL}>WhatsApp (optional)</label>
              <input id="account-whatsapp" name="whatsapp" type="tel" maxLength={30}
                defaultValue={metadataText(user, "whatsapp")} className={ACCOUNT_FIELD} />
            </div>
          </div>
          <div>
            <label htmlFor="account-delivery-address" className={ACCOUNT_LABEL}>Preferred delivery address (optional)</label>
            <textarea id="account-delivery-address" name="deliveryAddress" rows={3} maxLength={350}
              defaultValue={metadataText(user, "delivery_address")} autoComplete="street-address"
              placeholder="House, street, area, and a nearby landmark" className={ACCOUNT_FIELD} />
          </div>
          <GlassButton type="submit" disabled={saving}>{saving ? "Saving…" : "Save account details"}</GlassButton>
        </form>
      </GlassCard>}

      {activeTab === "wishlist" && <CustomerWishlist />}
      {activeTab === "orders" && <CustomerOrderHistory />}
    </div>
  );
}
