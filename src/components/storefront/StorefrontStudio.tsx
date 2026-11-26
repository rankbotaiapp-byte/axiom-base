"use client";

import { useEffect, useState } from "react";
import type { TenantStorefrontConfig } from "@/lib/schemas/tenant";
import { UnlockCheckoutButton } from "./UnlockCheckoutButton";
import { ShowcaseThemePicker } from "./showcase-theme-picker";
import { StorefrontMediaEditor } from "./StorefrontMediaEditor";
import { parseShowcaseThemeId, showcaseTheme, type ShowcaseThemeId } from "@/lib/axiom/outreach-desk";

type DeskPayload = {
  slug: string;
  businessName: string;
  niche: string;
  phase: "locked" | "draft" | "published";
  decision?: { reason?: string; requiresPlanSelection?: boolean; requiresUnlockFirst?: boolean };
  config: TenantStorefrontConfig | null;
  error?: string;
};

type PlanId = "monthly" | "lifetime";

const fieldClass = "mt-1 w-full rounded-xl border border-white/10 bg-[#050507] px-3 py-2 text-sm outline-none focus:border-[#00f2fe]";

export function StorefrontStudio({ slug }: { slug: string }) {
  const [desk, setDesk] = useState<DeskPayload | null>(null);
  const [draft, setDraft] = useState<TenantStorefrontConfig | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"save" | "publish" | "plan" | null>(null);
  const [planOpen, setPlanOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function load() {
    const response = await fetch(`/api/storefront/draft?slug=${encodeURIComponent(slug)}`);
    const json = (await response.json()) as DeskPayload;
    if (response.status === 404) {
      const locked: DeskPayload = {
        slug,
        businessName: slug,
        niche: "contractor",
        phase: "locked",
        decision: { reason: "UNLOCK_REQUIRED", requiresPlanSelection: false, requiresUnlockFirst: true },
        config: null,
      };
      setDesk(locked);
      setDraft(null);
      return locked;
    }
    if (!response.ok) throw new Error(json.error || "Studio could not load this shop.");
    setDesk(json);
    setDraft(json.config);
    return json;
  }

  useEffect(() => {
    let cancelled = false;
    void load()
      .then((json) => {
        if (cancelled) return;
        const params = new URLSearchParams(window.location.search);
        if (params.get("unlocked") === "1") setMessage("Studio is unlocked. The page stays a draft until you pick a plan and publish.");
        if (params.get("published") === "1" && json.phase !== "published") void goLive();
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Studio could not load this shop.");
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  function patch(next: TenantStorefrontConfig) {
    setDraft(next);
  }

  async function save() {
    if (!draft) return;
    setBusy("save");
    setError("");
    try {
      const response = await fetch("/api/storefront/draft", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, config: draft }),
      });
      const json = (await response.json()) as { error?: string; config?: TenantStorefrontConfig };
      if (!response.ok || !json.config) throw new Error(json.error || "Save did not finish.");
      setDraft(json.config);
      setMessage("Draft saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save did not finish.");
    } finally {
      setBusy(null);
    }
  }

  async function goLive() {
    setBusy("publish");
    setError("");
    try {
      if (draft) {
        const saved = await fetch("/api/storefront/draft", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ slug, config: draft }),
        });
        const savedJson = (await saved.json()) as { error?: string; config?: TenantStorefrontConfig };
        if (!saved.ok || !savedJson.config) throw new Error(savedJson.error || "Save did not finish.");
        setDraft(savedJson.config);
      }
      const response = await fetch("/api/storefront/publish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slug,
          showcaseThemeId: draft?.theme.showcaseThemeId || "solar_gold",
        }),
      });
      const json = (await response.json()) as { code?: string; error?: string; decision?: { reason?: string } };
      if (json.decision?.reason === "PLAN_SELECTION_REQUIRED" || json.code === "PLAN_SELECTION_REQUIRED") {
        setPlanOpen(true);
        setMessage("");
        return;
      }
      if (json.decision?.reason === "UNLOCK_REQUIRED" || json.code === "UNLOCK_REQUIRED") {
        setError("Unlock the page for $1 before publishing.");
        return;
      }
      if (!response.ok) throw new Error(json.error || "Publish did not finish.");
      setPlanOpen(false);
      setMessage("The page is live.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish did not finish.");
    } finally {
      setBusy(null);
    }
  }

  async function choosePlan(planId: PlanId) {
    setBusy("plan");
    setError("");
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          shopSlug: slug,
          planId,
          publishAfter: true,
          businessName: draft?.businessName || desk?.businessName,
          niche: desk?.niche,
          origin: window.location.origin,
          showcaseThemeId: draft?.theme.showcaseThemeId || "solar_gold",
        }),
      });
      const json = (await response.json()) as { url?: string; signInUrl?: string; error?: string };
      if (response.status === 401 && json.signInUrl) {
        window.location.assign(json.signInUrl);
        return;
      }
      if (!response.ok || !json.url) throw new Error(json.error || "Plan checkout did not open.");
      window.location.assign(json.url);
    } catch (err) {
      setBusy(null);
      setError(err instanceof Error ? err.message : "Plan checkout did not open.");
    }
  }

  if (!desk && !error) {
    return <p className="font-mono text-xs uppercase tracking-[0.16em] text-white/50">Opening this shop…</p>;
  }
  if (!desk) return <p className="text-sm text-[#ff2a3d]">{error}</p>;

  return (
    <section className="rounded-2xl border border-white/10 bg-[#0B0D12] p-4 text-[#f4f7fb]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#00f2fe]">This shop only</p>
          <h2 className="mt-1 text-xl font-semibold">{desk.businessName}</h2>
          <p className="text-sm text-white/60">{desk.niche} · {desk.phase === "published" ? "Live" : desk.phase === "draft" ? "Draft" : "Locked preview"}</p>
        </div>
        {desk.phase === "locked" ? (
          <UnlockCheckoutButton slug={desk.slug} businessName={desk.businessName} niche={desk.niche} />
        ) : (
          <button
            type="button"
            onClick={() => void goLive()}
            disabled={busy !== null || uploading}
            className="rounded-full bg-[#00f2fe] px-4 py-2 text-sm font-semibold text-[#050507] disabled:opacity-60"
          >
            {desk.phase === "published" ? "Published" : busy === "publish" ? "Publishing…" : "Publish Live"}
          </button>
        )}
      </div>
      {message ? <p className="mt-3 text-sm text-[#00f2fe]">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-[#ff2a3d]">{error}</p> : null}

      {desk.phase !== "locked" && draft ? (
        <div className="mt-4 grid gap-3">
          <label className="text-sm text-white/70">
            Business name
            <input className={fieldClass} value={draft.businessName} onChange={(event) => patch({ ...draft, businessName: event.target.value })} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-white/70">
              Primary color
              <input className={fieldClass} value={draft.theme.primaryAccent} onChange={(event) => patch({ ...draft, theme: { ...draft.theme, primaryAccent: event.target.value } })} />
            </label>
            <label className="text-sm text-white/70">
              Secondary color
              <input className={fieldClass} value={draft.theme.secondaryAccent} onChange={(event) => patch({ ...draft, theme: { ...draft.theme, secondaryAccent: event.target.value } })} />
            </label>
          </div>
          <label className="flex items-center gap-3 text-sm text-white/70">
            <input
              type="checkbox"
              className="size-4 accent-[#00f2fe]"
              checked={draft.theme.cinemaGrade !== false}
              onChange={(event) => patch({ ...draft, theme: { ...draft.theme, cinemaGrade: event.target.checked } })}
            />
            Cinematic grade on hero and proof photos
          </label>
          <label className="text-sm text-white/70">
            Headline
            <input className={fieldClass} value={draft.hero.headline} onChange={(event) => patch({ ...draft, hero: { ...draft.hero, headline: event.target.value } })} />
          </label>
          <label className="text-sm text-white/70">
            Subheadline
            <input className={fieldClass} value={draft.hero.subheadline} onChange={(event) => patch({ ...draft, hero: { ...draft.hero, subheadline: event.target.value } })} />
          </label>
          <StorefrontMediaEditor
            slug={slug}
            draft={draft}
            disabled={busy !== null || uploading}
            onChange={patch}
            onError={setError}
            onBusy={setUploading}
          />
          {draft.services.map((service, index) => (
            <div key={service.id} className="grid gap-2 rounded-xl border border-white/10 p-3 sm:grid-cols-2">
              <label className="text-sm text-white/70">
                Service
                <input
                  className={fieldClass}
                  value={service.title}
                  onChange={(event) => {
                    const services = draft.services.slice();
                    services[index] = { ...service, title: event.target.value };
                    patch({ ...draft, services });
                  }}
                />
              </label>
              <label className="text-sm text-white/70">
                Starting price
                <input
                  className={fieldClass}
                  value={service.startingPriceLabel}
                  onChange={(event) => {
                    const services = draft.services.slice();
                    services[index] = { ...service, startingPriceLabel: event.target.value };
                    patch({ ...draft, services });
                  }}
                />
              </label>
              <label className="text-sm text-white/70 sm:col-span-2">
                Summary
                <input
                  className={fieldClass}
                  value={service.summary}
                  onChange={(event) => {
                    const services = draft.services.slice();
                    services[index] = { ...service, summary: event.target.value };
                    patch({ ...draft, services });
                  }}
                />
              </label>
            </div>
          ))}
          <ShowcaseThemePicker
            value={parseShowcaseThemeId(draft.theme.showcaseThemeId)}
            onChange={(id: ShowcaseThemeId) => {
              const theme = showcaseTheme(id);
              patch({
                ...draft,
                theme: {
                  ...draft.theme,
                  showcaseThemeId: id,
                  ringColor: theme.ring,
                  ringHot: theme.ringHot,
                  callCta: theme.call,
                  bookCta: theme.book,
                  primaryAccent: theme.book,
                  secondaryAccent: theme.call,
                },
              });
            }}
          />
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => void save()} disabled={busy !== null || uploading} className="w-fit rounded-full border border-[#00f2fe] px-4 py-2 text-sm font-semibold text-[#00f2fe] disabled:opacity-60">
              {busy === "save" ? "Saving…" : "Save draft"}
            </button>
            <button
              type="button"
              onClick={() => void goLive()}
              disabled={busy !== null || uploading}
              className="rounded-full bg-[#FF9900] px-4 py-2 text-sm font-semibold text-[#050507] disabled:opacity-60"
            >
              {desk.phase === "published" ? "Published" : busy === "publish" ? "Publishing…" : "Publish"}
            </button>
          </div>
        </div>
      ) : null}

      {planOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center">
          <section className="w-full max-w-md rounded-t-2xl border border-white/10 bg-[#0B0D12] p-5 sm:rounded-2xl" role="dialog" aria-modal="true" aria-labelledby="plan-gate-title">
            <h3 id="plan-gate-title" className="text-xl font-semibold">Choose your plan to go live</h3>
            <p className="mt-1 text-sm text-white/65">The $1 unlock keeps this page a draft. A plan publishes it.</p>
            <div className="mt-4 grid gap-2">
              <button type="button" disabled={busy === "plan"} onClick={() => void choosePlan("monthly")} className="rounded-xl border border-[#00f2fe] px-4 py-3 text-left">
                <span className="block font-semibold">Axiom monthly</span>
                <span className="text-sm text-white/60">$150/mo</span>
              </button>
              <button type="button" disabled={busy === "plan"} onClick={() => void choosePlan("lifetime")} className="rounded-xl border border-white/15 px-4 py-3 text-left">
                <span className="block font-semibold">Founder&apos;s lifetime</span>
                <span className="text-sm text-white/60">$1,500 once</span>
              </button>
            </div>
            <button type="button" onClick={() => setPlanOpen(false)} className="mt-3 text-sm text-white/60">
              Keep editing the draft
            </button>
          </section>
        </div>
      ) : null}
    </section>
  );
}
