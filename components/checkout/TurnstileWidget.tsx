"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback": () => void;
          "error-callback": () => void;
          theme?: "light" | "dark" | "auto";
        }
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

interface TurnstileWidgetProps {
  siteKey: string;
  onToken: (token: string | null) => void;
}

export function TurnstileWidget({ siteKey, onToken }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onToken);

  useEffect(() => {
    callbackRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;

    let widgetId: string | null = null;
    let disposed = false;
    const handleScriptError = () => callbackRef.current(null);
    const renderWidget = () => {
      if (disposed || widgetId || !containerRef.current || !window.turnstile) return;
      widgetId = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: "auto",
        callback: (token) => callbackRef.current(token),
        "expired-callback": () => callbackRef.current(null),
        "error-callback": () => callbackRef.current(null),
      });
    };

    let script = document.getElementById("cloudflare-turnstile") as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = "cloudflare-turnstile";
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    script.addEventListener("load", renderWidget);
    script.addEventListener("error", handleScriptError, { once: true });
    if (window.turnstile) renderWidget();

    return () => {
      disposed = true;
      script?.removeEventListener("load", renderWidget);
      script?.removeEventListener("error", handleScriptError);
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
      callbackRef.current(null);
    };
  }, [siteKey]);

  return <div ref={containerRef} aria-label="Security verification" />;
}
