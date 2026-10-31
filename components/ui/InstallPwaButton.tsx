"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone } from "lucide-react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function InstallPwaButton({ label = "Install PWA" }: { label?: string }) {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    const ios = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    setIsInstalled(standalone);
    setIsIos(ios);

    const onInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onInstallPrompt);
  }, []);

  async function install() {
    if (!installPrompt) {
      setShowIosHelp(true);
      return;
    }

    setError(null);
    try {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
    } catch {
      setError("Installation could not be started. Use your browser menu to install this app.");
    }
  }

  if (isInstalled) {
    return (
      <span className="flex items-center gap-2 text-muted">
        <Smartphone size={15} aria-hidden="true" />
        App installed
      </span>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={install}
        className="flex items-center gap-2 text-muted transition-colors hover:text-ink"
      >
        {isIos ? <Smartphone size={15} aria-hidden="true" /> : <Download size={15} aria-hidden="true" />}
        {label}
      </button>
      {showIosHelp ? (
        <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted" role="status">
          In Safari, tap Share, then choose Add to Home Screen.
        </p>
      ) : null}
      {error ? (
        <p className="mt-2 max-w-xs text-xs leading-relaxed text-red-500" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
