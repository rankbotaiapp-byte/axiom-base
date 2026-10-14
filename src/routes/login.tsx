import { useState, type FormEvent } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { GROK_PROVIDERS, authClient, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Wordmark } from "@/components/shop-chrome";
import { isShopNiche, type ShopNiche } from "@/lib/axiom/types";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): { next?: string } => ({
    next: typeof s.next === "string" ? s.next : undefined,
  }),
  component: Login,
});

/** Stay on this site. A protocol-relative or off-site next value goes to onboarding. */
function safeNext(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || value.includes("://")) {
    return "/onboard";
  }
  return value;
}

function onboardNiche(next: string): ShopNiche | undefined {
  const query = next.split("?")[1] ?? "";
  const niche = new URLSearchParams(query).get("niche") ?? "";
  if (!isShopNiche(niche) || niche === "trade") return undefined;
  return niche;
}

function signInMessage(message: string | undefined) {
  if (!message || message === "Invalid email or password" || message === "User not found") {
    return "That email and password don't match an account. Create an account, or use the password from the one you already made.";
  }
  return message;
}

function Login() {
  const { user, isPending } = useCurrentUserState();
  const next = safeNext(Route.useSearch().next);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (isPending) {
    return (
      <main className="grid min-h-dvh place-items-center bg-bg">
        <div className="h-10 w-40 animate-pulse rounded-full bg-fg/8" />
      </main>
    );
  }
  if (user) {
    const path = next.split("?")[0] || "/onboard";
    const niche = onboardNiche(next);
    if (path === "/onboard") return <Navigate to="/onboard" search={niche ? { niche } : {}} />;
    return <Navigate to={path.startsWith("/") ? path : "/onboard"} />;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "up") {
        const { error: err } = await authClient.signUp.email({
          email,
          password,
          name: name || email.split("@")[0] || "Owner",
        });
        if (err) throw new Error(signInMessage(err.message));
      } else {
        const { error: err } = await authClient.signIn.email({ email, password });
        if (err) throw new Error(signInMessage(err.message));
      }
      window.location.href = next;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-4 py-10">
      <div className="w-full max-w-sm">
        <Wordmark />
        <h1 className="mt-8 font-display text-4xl leading-none">Step in.</h1>
        <p className="mt-2 text-sm text-muted">
          Google, X, or email. Your shop is a minute away.
        </p>
        <div className="mt-8 flex flex-col gap-2">
          {GROK_PROVIDERS.map((p) => (
            <Button
              key={p.providerId}
              variant="secondary"
              size="lg"
              onClick={() => void signIn(p.providerId, { callbackURL: next })}
            >
              Continue with {p.label}
            </Button>
          ))}
        </div>
        <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-faint">
          <span className="h-px flex-1 bg-line" />
          or email
          <span className="h-px flex-1 bg-line" />
        </div>
        <form onSubmit={(e) => void submit(e)} className="grid gap-3">
          {mode === "up" ? (
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          ) : null}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "up" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit" size="lg" disabled={busy}>
            {mode === "up" ? "Create account" : "Sign in"}
          </Button>
        </form>
        <button
          type="button"
          className="mt-4 text-sm text-muted hover:text-fg"
          onClick={() => setMode(mode === "up" ? "in" : "up")}
        >
          {mode === "up" ? "Already have an account" : "Need an account"}
        </button>
      </div>
    </main>
  );
}
