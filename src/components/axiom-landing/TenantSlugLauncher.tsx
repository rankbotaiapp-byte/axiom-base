"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { publicShopSlug } from "@/lib/axiom/shop-slug";
import { RippleButton } from "./RippleButton";

function normalizeSlugInput(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^\/+/, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function TenantSlugLauncher() {
  const router = useRouter();
  const [slugInput, setSlugInput] = useState("accurate-plumbing");
  const [error, setError] = useState<string | null>(null);
  const previewSlug = useMemo(() => normalizeSlugInput(slugInput), [slugInput]);
  const validSlug = useMemo(() => publicShopSlug(previewSlug), [previewSlug]);

  function launch(event: FormEvent) {
    event.preventDefault();
    const slug = publicShopSlug(normalizeSlugInput(slugInput));
    if (!slug) {
      setError("Enter a valid business slug, like accurate-plumbing.");
      return;
    }
    setError(null);
    router.push(`/${slug}`);
  }

  return (
    <section id="launch" className="relative overflow-hidden bg-slate py-20 sm:py-24">
      <div className="relative mx-auto max-w-5xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-volt">Live tenant routing</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Open any storefront by slug
          </h2>
          <p className="mt-4 text-mist">
            Every contractor gets a dedicated <span className="text-white">/[shopSlug]</span> path with cinematic
            hero film, booking calendar, and the 24/7 automated intake engine — editable from their admin desk.
          </p>
        </div>

        <form
          onSubmit={launch}
          className="mt-10 border border-white/10 bg-panel/70 p-5 sm:p-7"
        >
          <label htmlFor="landing-tenant-slug" className="mb-2 block text-sm text-mist">
            Business slug
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono text-mist">/</span>
              <input
                id="landing-tenant-slug"
                type="text"
                value={slugInput}
                onChange={(e) => {
                  setSlugInput(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="accurate-plumbing"
                autoComplete="off"
                spellCheck={false}
                className="h-12 w-full border border-white/10 bg-black/40 pl-8 pr-4 font-mono text-sm text-white outline-none transition focus:border-volt"
              />
            </div>
            <RippleButton type="submit" variant="volt" className="h-12 shrink-0" disabled={!validSlug}>
              Launch storefront <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
            </RippleButton>
          </div>
          <p className="mt-3 font-mono text-xs text-mist">
            Routes to{" "}
            <span className="text-volt">/{previewSlug || "your-shop-slug"}</span>
          </p>
          {error ? (
            <p className="mt-2 text-sm text-[var(--color-hud-crimson)]" role="alert">
              {error}
            </p>
          ) : null}
        </form>
      </div>
    </section>
  );
}
