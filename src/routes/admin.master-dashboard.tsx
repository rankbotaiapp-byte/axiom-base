import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { GlobalMasterDashboard } from "@/components/master/global-master-dashboard";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { claimMasterBypass, masterEntry, masterGate } from "@/lib/axiom/master";

export const Route = createFileRoute("/admin/master-dashboard")({
  validateSearch: (search: Record<string, unknown>): { key?: string } => {
    const key = typeof search.key === "string" ? search.key : "";
    return key ? { key: key.slice(0, 200) } : {};
  },
  head: () => ({
    meta: [
      { title: "Master Admin Dashboard · Axiom" },
      { name: "theme-color", content: "#030712" },
      { name: "description", content: "Platform master telemetry and tenant control." },
    ],
  }),
  component: MasterDashboardRoute,
});

type GateState = "loading" | "open" | "signed-out" | "forbidden" | "key";

function MasterDashboardRoute() {
  const { user, isPending } = useCurrentUserState();
  const { key } = Route.useSearch();
  const [gate, setGate] = useState<GateState>("loading");
  const [configured, setConfigured] = useState(false);
  const [keyDraft, setKeyDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      if (key) {
        try {
          await claimMasterBypass({ data: { key } });
          if (!cancelled) setGate("open");
          return;
        } catch (err) {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : "Key rejected");
            setGate("key");
          }
        }
      }

      let bypassConfigured = configured;
      try {
        const entry = await masterEntry();
        if (cancelled) return;
        bypassConfigured = entry.configured;
        setConfigured(entry.configured);
        if (entry.access === "bypass") {
          setGate("open");
          return;
        }
      } catch {
        /* fall through to session RBAC */
      }

      if (isPending) return;

      if (!user) {
        setGate(bypassConfigured ? "key" : "signed-out");
        return;
      }

      try {
        const { open } = await masterGate();
        if (cancelled) return;
        setGate(open ? "open" : bypassConfigured ? "key" : "forbidden");
      } catch {
        if (!cancelled) setGate(bypassConfigured ? "key" : "forbidden");
      }
    };
    void boot();
    return () => {
      cancelled = true;
    };
  }, [isPending, key, user]);

  if (gate === "loading" || isPending) {
    return (
      <main className="grid min-h-dvh place-items-center" style={{ background: "#030712" }}>
        <div className="h-10 w-48 animate-pulse rounded-full bg-amber-400/20" />
      </main>
    );
  }

  if (gate === "signed-out") {
    return <RedirectToSignIn to="/login" next="/admin/master-dashboard" />;
  }

  if (gate === "forbidden" || gate === "key") {
    return (
      <main className="grid min-h-dvh place-items-center px-4" style={{ background: "#030712" }}>
        <form
          className="w-full max-w-md rounded-2xl border border-amber-400/35 bg-[#0a0f1a]/90 p-6 backdrop-blur-md"
          onSubmit={(e) => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            void claimMasterBypass({ data: { key: keyDraft.trim() } })
              .then(() => setGate("open"))
              .catch((err: unknown) => {
                setError(err instanceof Error ? err.message : "Key rejected");
              })
              .finally(() => setBusy(false));
          }}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-amber-300/80">Secure authentication gate</p>
          <h1 className="mt-2 text-xl font-semibold text-[#e8e8ed]">Master clearance</h1>
          <p className="mt-2 text-sm text-[#8b8b96]">
            {gate === "forbidden"
              ? "This account lacks platform owner RBAC. Enter the master bypass key or return to the portal."
              : "Platform owner RBAC failed. Enter the master bypass key to continue."}
          </p>
          <input
            type="password"
            required
            minLength={16}
            value={keyDraft}
            onChange={(e) => setKeyDraft(e.target.value)}
            className="mt-4 h-11 w-full rounded-xl border border-amber-400/35 bg-[#030712] px-3 text-sm text-[#e8e8ed] outline-none focus:border-amber-300/70"
            placeholder="Owner key"
          />
          {error ? <p className="mt-2 text-sm text-[#e07a73]">{error}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="mt-4 h-11 w-full rounded-xl border border-amber-400/50 bg-amber-400/15 font-medium text-[#e8e8ed] hover:bg-amber-400/25 disabled:opacity-60"
          >
            {busy ? "Verifying…" : "Unlock dashboard"}
          </button>
          <a
            href="/login"
            className="mt-3 block text-center font-mono text-[10px] uppercase tracking-[0.18em] text-[#8b8b96] hover:text-[#00ffcc]"
          >
            Return to portal
          </a>
        </form>
      </main>
    );
  }

  return <GlobalMasterDashboard />;
}
