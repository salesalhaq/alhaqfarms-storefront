"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseAuthClient } from "@/lib/supabase-auth";

interface WishlistContextValue {
  productIds: Set<string>;
  session: Session | null;
  ready: boolean;
  error: string;
  clearError: () => void;
  toggleProduct: (productId: string) => Promise<boolean>;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [productIds, setProductIds] = useState<Set<string>>(() => new Set());
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const requestVersion = useRef(0);

  const loadSessionWishlist = useCallback(async (nextSession: Session | null) => {
    const version = ++requestVersion.current;
    setSession(nextSession);
    setError("");
    setReady(false);
    setProductIds(new Set());

    if (!nextSession) {
      setProductIds(new Set());
      setReady(true);
      return;
    }

    try {
      const response = await fetch("/api/account/wishlist", {
        headers: { Authorization: `Bearer ${nextSession.access_token}` },
        cache: "no-store",
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const message =
          typeof result === "object" && result !== null && "error" in result &&
          typeof result.error === "string"
            ? result.error
            : "Could not load your wishlist.";
        throw new Error(message);
      }
      if (
        typeof result !== "object" ||
        result === null ||
        !("items" in result) ||
        !Array.isArray(result.items)
      ) {
        throw new Error("The wishlist service returned an invalid response.");
      }
      if (version === requestVersion.current) {
        setProductIds(new Set(result.items.flatMap((item) =>
          typeof item === "object" && item !== null &&
          "productId" in item && typeof item.productId === "string"
            ? [item.productId]
            : []
        )));
      }
    } catch (cause) {
      if (version === requestVersion.current) {
        setError(cause instanceof Error ? cause.message : "Could not load your wishlist.");
      }
    } finally {
      if (version === requestVersion.current) setReady(true);
    }
  }, []);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | null = null;

    async function initialize() {
      try {
        const client = await getSupabaseAuthClient();
        if (!active) return;
        if (!client) {
          setReady(true);
          return;
        }

        const { data: listener } = client.auth.onAuthStateChange((_event, nextSession) => {
          if (active) void loadSessionWishlist(nextSession);
        });
        unsubscribe = () => listener.subscription.unsubscribe();

        const { data, error: sessionError } = await client.auth.getSession();
        if (!active) return;
        if (sessionError) {
          setError(sessionError.message);
          setReady(true);
        } else {
          await loadSessionWishlist(data.session);
        }
      } catch (cause) {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : "Wishlist is unavailable.");
        setReady(true);
      }
    }

    void initialize();
    return () => {
      active = false;
      requestVersion.current += 1;
      unsubscribe?.();
    };
  }, [loadSessionWishlist]);

  const toggleProduct = useCallback(async (productId: string): Promise<boolean> => {
    setError("");
    try {
      const client = await getSupabaseAuthClient();
      if (!client) throw new Error("Account sign-in is not configured.");
      const { data, error: sessionError } = await client.auth.getSession();
      if (sessionError) throw new Error(sessionError.message);
      if (!data.session) return false;

      const isSaved = productIds.has(productId);
      const response = await fetch("/api/account/wishlist", {
        method: isSaved ? "DELETE" : "POST",
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const message =
          typeof result === "object" && result !== null && "error" in result &&
          typeof result.error === "string"
            ? result.error
            : "Could not update your wishlist.";
        throw new Error(message);
      }
      setSession(data.session);
      setProductIds((current) => {
        const next = new Set(current);
        if (isSaved) next.delete(productId);
        else next.add(productId);
        return next;
      });
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update your wishlist.");
      return false;
    }
  }, [productIds]);

  const value = useMemo<WishlistContextValue>(() => ({
    productIds,
    session,
    ready,
    error,
    clearError: () => setError(""),
    toggleProduct,
  }), [productIds, session, ready, error, toggleProduct]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used within a WishlistProvider.");
  return context;
}
