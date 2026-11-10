import { useCallback, useEffect, useState } from "react";
import { Check, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function usePwaInstall() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator && Boolean((window.navigator as { standalone?: boolean }).standalone));
    if (standalone) setInstalled(true);
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!promptEvent) return false;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    setPromptEvent(null);
    if (choice.outcome === "accepted") setInstalled(true);
    return choice.outcome === "accepted";
  }, [promptEvent]);

  return { canInstall: Boolean(promptEvent) && !installed, installed, install };
}

export function PwaInstallButton() {
  const { canInstall, installed, install } = usePwaInstall();
  const [busy, setBusy] = useState(false);
  const ios =
    typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent) && !canInstall && !installed;

  async function onInstall() {
    setBusy(true);
    try {
      await install();
    } finally {
      setBusy(false);
    }
  }

  if (installed) {
    return (
      <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-ok">
        <Check size={14} aria-hidden /> On your home screen
      </p>
    );
  }

  return (
    <div className="grid gap-2">
      <Button
        type="button"
        variant="accent"
        size="lg"
        className="w-full min-h-12"
        disabled={!canInstall || busy}
        onClick={() => void onInstall()}
      >
        <Smartphone size={18} aria-hidden />
        Add to Phone (One Tap)
      </Button>
      <p className="text-xs leading-relaxed text-muted">
        {canInstall
          ? "Installs this shop desk on your home screen. No App Store. No extra login."
          : ios
            ? "On iPhone: tap Share, then Add to Home Screen. Chrome on Android shows the one-tap button when the prompt is ready."
            : "When this browser is ready to install, the button lights up. You can keep going either way."}
      </p>
    </div>
  );
}
