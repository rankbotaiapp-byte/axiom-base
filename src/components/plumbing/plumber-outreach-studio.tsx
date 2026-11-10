import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Laptop, Lock, RotateCcw, Smartphone, Trash2, UploadCloud } from "lucide-react";
import { toast, Toaster } from "sonner";
import {
  DEFAULT_PLUMBER_OUTREACH,
  PLUMBER_OUTREACH_DRAFT_CHANNEL,
  PLUMBER_OUTREACH_DRAFT_MESSAGE,
  checkDispatchMobile,
  parsePlumberOutreach,
  type PlumberOutreachConfig,
} from "@/lib/axiom/plumber-outreach";
import { plumberOutreachAccess, savePlumberOutreach } from "@/lib/axiom/plumber-outreach.functions";
import type { OutreachRead } from "@/lib/axiom/plumber-outreach.server";
import { AddButton, Area, Field, IconButton, Section, UnlockCard } from "./plumbing-studio";

const DRAFT_KEY = "axiom:plumber-outreach-studio-draft";
const DEFAULT_PREVIEW_SLUG = "studio-preview";

const HERO_CHOICES = [
  {
    label: "Plumbers outreach (Axiom contractor film)",
    url: "/media/plumbers-outreach-hero-animation.mp4",
    mobile: "/media/plumbers-outreach-hero-animation-mobile.mp4",
    poster: "/media/plumbers-outreach-hero-poster.jpg",
  },
  { label: "Axiom plumber hero", url: "/media/axiom-plumber-hero.mp4", mobile: "/media/axiom-plumber-hero-mobile.mp4", poster: "/media/axiom-plumber-hero.jpg" },
  { label: "Plumbing emergency", url: "/media/plumbing-emergency-hero.mp4", mobile: "/media/plumbing-emergency-hero-mobile.mp4", poster: "/media/axiom-plumber-hero.jpg" },
];

type Access = { ok: boolean; reason: string } | null;

function readLocalDraft(): PlumberOutreachConfig | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    return raw ? parsePlumberOutreach(raw) : null;
  } catch {
    return null;
  }
}

function writeLocalDraft(cfg: PlumberOutreachConfig | null) {
  try {
    if (cfg) window.localStorage.setItem(DRAFT_KEY, JSON.stringify(cfg));
    else window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* storage can be unavailable; the draft still lives in memory */
  }
}

function previewPath(slug: string, studio: boolean) {
  const safe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? slug : DEFAULT_PREVIEW_SLUG;
  return `/t/${safe}?niche=plumbing${studio ? "&studio=1" : ""}`;
}

/**
 * Owner editor for the plumber outreach landing (`/t/{slug}?niche=plumbing`).
 * Every word, number, button label, service, time slot, testimonial and film on
 * the page is edited here, previewed live on desktop and phone, then published.
 */
export function PlumberOutreachStudio({ initial }: { initial: OutreachRead }) {
  const [published, setPublished] = useState(initial);
  const [draft, setDraft] = useState<PlumberOutreachConfig>(initial.config);
  const [device, setDevice] = useState<"desktop" | "mobile">("mobile");
  const [access, setAccess] = useState<Access>(null);
  const [saving, setSaving] = useState(false);
  const [slug, setSlug] = useState(DEFAULT_PREVIEW_SLUG);
  const frame = useRef<HTMLIFrameElement>(null);
  const channel = useRef<BroadcastChannel | null>(null);
  const draftRef = useRef(draft);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(published.config), [draft, published]);

  useEffect(() => {
    const local = readLocalDraft();
    if (local) setDraft(local);
    void plumberOutreachAccess().then(setAccess).catch(() => setAccess({ ok: false, reason: "locked" }));
  }, []);

  const push = useCallback((cfg: PlumberOutreachConfig) => {
    const msg = { type: PLUMBER_OUTREACH_DRAFT_MESSAGE, config: cfg };
    frame.current?.contentWindow?.postMessage(msg, window.location.origin);
    channel.current?.postMessage(msg);
  }, []);

  useEffect(() => {
    try {
      channel.current = new BroadcastChannel(PLUMBER_OUTREACH_DRAFT_CHANNEL);
    } catch {
      channel.current = null;
    }
    const onReady = (event: MessageEvent) => {
      if (event.origin === window.location.origin && event.data?.type === `${PLUMBER_OUTREACH_DRAFT_MESSAGE}:ready`) push(draftRef.current);
    };
    window.addEventListener("message", onReady);
    return () => {
      window.removeEventListener("message", onReady);
      channel.current?.close();
    };
  }, [push]);

  useEffect(() => {
    draftRef.current = draft;
    push(draft);
    writeLocalDraft(dirty ? draft : null);
  }, [draft, dirty, push]);

  function edit(mutate: (next: PlumberOutreachConfig) => void) {
    setDraft((current) => {
      const next = structuredClone(current);
      mutate(next);
      return next;
    });
  }

  async function publish() {
    setSaving(true);
    try {
      const saved = await savePlumberOutreach({ data: draft });
      setPublished(saved);
      setDraft(saved.config);
      writeLocalDraft(null);
      toast.success("Published — every plumber outreach link is updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not publish.");
      void plumberOutreachAccess().then(setAccess).catch(() => undefined);
    } finally {
      setSaving(false);
    }
  }

  const locked = access && !access.ok;
  const fallbackPhone = draft.ctas.fallbackPhone.trim();
  const fallbackCheck = fallbackPhone ? checkDispatchMobile(fallbackPhone) : null;

  return (
    <>
      <Toaster theme="dark" position="top-center" />
      <div className="studio-root">
        <aside className="studio-panel">
          <header className="studio-head">
            <div>
              <p className="studio-kicker">Axiom Master Admin Studio</p>
              <h1 className="studio-title">Plumber outreach landing</h1>
              <p className="studio-status">
                <span className={`studio-dot ${dirty ? "is-draft" : "is-live"}`} />
                {dirty
                  ? "Unpublished changes — preview only"
                  : published.updatedAt
                    ? `Live · published ${new Date(published.updatedAt).toLocaleString()}`
                    : "Live · using template defaults"}
              </p>
            </div>
            {access?.reason === "local-dev" ? <span className="studio-chip">Local dev · open</span> : null}
          </header>

          <div className="studio-scroll">
            {locked ? <UnlockCard reason={access.reason} onUnlocked={() => void plumberOutreachAccess().then(setAccess)} /> : null}

            <Section title="Preview link" hint="Not saved">
              <Field
                label="Territory slug to preview (the part after /t/)"
                value={slug}
                placeholder={DEFAULT_PREVIEW_SLUG}
                onChange={(v) => setSlug(v.trim().toLowerCase())}
              />
              <p className="studio-status">
                Use {"{business}"}, {"{city}"} and {"{county}"} in any text below — each link fills in its own plumber.
              </p>
            </Section>

            <Section title="Hero overlay">
              <Field label="Eyebrow" value={draft.hero.eyebrow} onChange={(v) => edit((d) => void (d.hero.eyebrow = v))} />
              <Area label="Headline" rows={2} value={draft.hero.headline} onChange={(v) => edit((d) => void (d.hero.headline = v))} />
              <Area label="Subhead" rows={3} value={draft.hero.subhead} onChange={(v) => edit((d) => void (d.hero.subhead = v))} />
              <label className="studio-field">
                <span>
                  Scrim over the film <em>{draft.hero.scrim}%</em>
                </span>
                <input type="range" min={0} max={100} value={draft.hero.scrim} onChange={(e) => edit((d) => void (d.hero.scrim = Number(e.target.value)))} />
              </label>
            </Section>

            <Section title="Hero film" hint="Plays untouched, on loop">
              <label className="studio-field">
                <span>Film</span>
                <select
                  value={HERO_CHOICES.find((c) => c.url === draft.hero.videoUrl)?.url ?? "custom"}
                  onChange={(e) => {
                    const pick = HERO_CHOICES.find((c) => c.url === e.target.value);
                    if (pick) edit((d) => void Object.assign(d.hero, { videoUrl: pick.url, mobileVideoUrl: pick.mobile, posterUrl: pick.poster }));
                  }}
                >
                  {HERO_CHOICES.map((c) => (
                    <option key={c.url} value={c.url}>
                      {c.label}
                    </option>
                  ))}
                  <option value="custom" disabled>
                    Custom URL (below)
                  </option>
                </select>
              </label>
              <Field label="Video URL" value={draft.hero.videoUrl} onChange={(v) => edit((d) => void (d.hero.videoUrl = v))} />
              <Field
                label="Phone-size video URL (blank = same film)"
                value={draft.hero.mobileVideoUrl}
                onChange={(v) => edit((d) => void (d.hero.mobileVideoUrl = v))}
              />
              <Field label="Poster frame (first paint, prevents flicker)" value={draft.hero.posterUrl} onChange={(v) => edit((d) => void (d.hero.posterUrl = v))} />
            </Section>

            <Section title="Proof-of-work metric">
              <label className="studio-toggle">
                <input type="checkbox" checked={draft.metric.enabled} onChange={(e) => edit((d) => void (d.metric.enabled = e.target.checked))} />
                Show the metric card on the hero
              </label>
              <div className="studio-grid-2">
                <Field label="Big number" value={String(draft.metric.count)} onChange={(v) => edit((d) => void (d.metric.count = Number(v.replace(/\D/g, "")) || 0))} />
                <Field
                  label="Sample tag (clear once the number is real)"
                  value={draft.metric.sampleLabel}
                  onChange={(v) => edit((d) => void (d.metric.sampleLabel = v))}
                />
              </div>
              <Area label="Line beside the number" rows={2} value={draft.metric.line} onChange={(v) => edit((d) => void (d.metric.line = v))} />
              {draft.metric.stats.map((s, i) => (
                <div key={s.id} className="studio-row">
                  <input className="is-narrow" value={s.value} aria-label="Stat value" onChange={(e) => edit((d) => void (d.metric.stats[i].value = e.target.value))} />
                  <input value={s.label} aria-label="Stat label" onChange={(e) => edit((d) => void (d.metric.stats[i].label = e.target.value))} />
                  <IconButton label="Remove stat" onClick={() => edit((d) => void d.metric.stats.splice(i, 1))}>
                    <Trash2 size={14} />
                  </IconButton>
                </div>
              ))}
              {draft.metric.stats.length < 3 ? (
                <AddButton onClick={() => edit((d) => void d.metric.stats.push({ id: `m${Date.now()}`, value: "100%", label: "New stat" }))}>Add stat</AddButton>
              ) : null}
            </Section>

            <Section title="Buttons">
              <Field label="Primary button (trial)" value={draft.ctas.trialLabel} onChange={(v) => edit((d) => void (d.ctas.trialLabel = v))} />
              <Area label="Fine print under the buttons" rows={2} value={draft.ctas.trialNote} onChange={(v) => edit((d) => void (d.ctas.trialNote = v))} />
              <div className="studio-grid-2">
                <Field label="Call button" value={draft.ctas.callLabel} onChange={(v) => edit((d) => void (d.ctas.callLabel = v))} />
                <Field label="Dispatch label" value={draft.ctas.dispatchLabel} onChange={(v) => edit((d) => void (d.ctas.dispatchLabel = v))} />
              </div>
              <Field
                label="Fallback phone (used only when a link has no tenant number)"
                placeholder="Blank = button opens the dispatch request"
                value={draft.ctas.fallbackPhone}
                onChange={(v) => edit((d) => void (d.ctas.fallbackPhone = v))}
              />
              {fallbackCheck && !fallbackCheck.ok ? <p className="studio-status">⚠ {fallbackCheck.reason}</p> : null}
              {draft.badges.map((b, i) => (
                <div key={b.id} className="studio-row">
                  <input value={b.label} aria-label="Trust badge" onChange={(e) => edit((d) => void (d.badges[i].label = e.target.value))} />
                  <IconButton label="Remove badge" onClick={() => edit((d) => void d.badges.splice(i, 1))}>
                    <Trash2 size={14} />
                  </IconButton>
                </div>
              ))}
              {draft.badges.length < 4 ? (
                <AddButton onClick={() => edit((d) => void d.badges.push({ id: `b${Date.now()}`, label: "New badge" }))}>Add trust badge</AddButton>
              ) : null}
            </Section>

            <Section title="Checkout modal" hint="$1 minimum is enforced">
              <Field label="Title" value={draft.checkout.title} onChange={(v) => edit((d) => void (d.checkout.title = v))} />
              <Area label="Blurb" rows={2} value={draft.checkout.blurb} onChange={(v) => edit((d) => void (d.checkout.blurb = v))} />
              <div className="studio-grid-2">
                <Field
                  label="One-tap amounts ($, comma-separated)"
                  value={draft.checkout.presets.join(", ")}
                  onChange={(v) =>
                    edit((d) => {
                      d.checkout.presets = v
                        .split(",")
                        .map((part) => Math.round(Number(part.replace(/[^0-9.]/g, ""))))
                        .filter((n) => Number.isFinite(n) && n >= 1)
                        .slice(0, 4);
                    })
                  }
                />
                <Field
                  label="Amount selected on open ($)"
                  value={String(draft.checkout.defaultDollars)}
                  onChange={(v) => edit((d) => void (d.checkout.defaultDollars = Math.max(1, Number(v.replace(/\D/g, "")) || 1)))}
                />
              </div>
              <Field label="Fallback link if card checkout can't open" value={draft.checkout.fallbackHref} onChange={(v) => edit((d) => void (d.checkout.fallbackHref = v))} />
            </Section>

            <Section title="Mobile lock + test SMS" hint="After payment">
              <Field label="Title" value={draft.mobileLock.title} onChange={(v) => edit((d) => void (d.mobileLock.title = v))} />
              <Area label="Blurb" rows={2} value={draft.mobileLock.blurb} onChange={(v) => edit((d) => void (d.mobileLock.blurb = v))} />
              <Field label="Test button" value={draft.mobileLock.testLabel} onChange={(v) => edit((d) => void (d.mobileLock.testLabel = v))} />
              <Area label="Text message that is sent ({business} is filled in)" rows={3} value={draft.mobileLock.smsBody} onChange={(v) => edit((d) => void (d.mobileLock.smsBody = v))} />
              <Field label="Success title" value={draft.mobileLock.doneTitle} onChange={(v) => edit((d) => void (d.mobileLock.doneTitle = v))} />
              <Area label="Success line" rows={2} value={draft.mobileLock.doneBody} onChange={(v) => edit((d) => void (d.mobileLock.doneBody = v))} />
              <p className="studio-status">555 placeholder, toll-free and filler numbers are always refused — that rule is not editable.</p>
            </Section>

            <Section title="Feature film: Inside Your Lines" hint="Under the hero">
              <label className="studio-toggle">
                <input type="checkbox" checked={draft.feature.enabled} onChange={(e) => edit((d) => void (d.feature.enabled = e.target.checked))} />
                Show the pipe-rafting feature section
              </label>
              <Field label="Kicker" value={draft.feature.kicker} onChange={(v) => edit((d) => void (d.feature.kicker = v))} />
              <Area label="Title" rows={2} value={draft.feature.title} onChange={(v) => edit((d) => void (d.feature.title = v))} />
              <Area label="Blurb" rows={4} value={draft.feature.blurb} onChange={(v) => edit((d) => void (d.feature.blurb = v))} />
              {draft.feature.points.map((f, i) => (
                <div key={f.id} className="studio-card">
                  <div className="studio-row">
                    <input value={f.title} aria-label="Point title" onChange={(e) => edit((d) => void (d.feature.points[i].title = e.target.value))} />
                    <IconButton label="Remove point" onClick={() => edit((d) => void d.feature.points.splice(i, 1))}>
                      <Trash2 size={14} />
                    </IconButton>
                  </div>
                  <textarea rows={2} value={f.detail} aria-label="Point detail" onChange={(e) => edit((d) => void (d.feature.points[i].detail = e.target.value))} />
                </div>
              ))}
              {draft.feature.points.length < 4 ? (
                <AddButton onClick={() => edit((d) => void d.feature.points.push({ id: `f${Date.now()}`, title: "New point", detail: "" }))}>Add point</AddButton>
              ) : null}
              <Field label="Button under the copy (blank hides it)" value={draft.feature.ctaLabel} onChange={(v) => edit((d) => void (d.feature.ctaLabel = v))} />
              <Field label="Caption on the video card" value={draft.feature.caption} onChange={(v) => edit((d) => void (d.feature.caption = v))} />
              <Field label="Video URL" value={draft.feature.videoUrl} onChange={(v) => edit((d) => void (d.feature.videoUrl = v))} />
              <Field label="Poster URL" value={draft.feature.posterUrl} onChange={(v) => edit((d) => void (d.feature.posterUrl = v))} />
            </Section>

            <Section title="Service menu" hint="Up to 8">
              <Field label="Kicker" value={draft.services.kicker} onChange={(v) => edit((d) => void (d.services.kicker = v))} />
              <Field label="Headline" value={draft.services.headline} onChange={(v) => edit((d) => void (d.services.headline = v))} />
              {draft.services.items.map((s, i) => (
                <div key={s.id} className="studio-card">
                  <div className="studio-row">
                    <input value={s.title} aria-label="Service" onChange={(e) => edit((d) => void (d.services.items[i].title = e.target.value))} />
                    <input className="is-narrow" value={s.price} aria-label="Price" onChange={(e) => edit((d) => void (d.services.items[i].price = e.target.value))} />
                    <IconButton label="Remove service" onClick={() => edit((d) => void d.services.items.splice(i, 1))}>
                      <Trash2 size={14} />
                    </IconButton>
                  </div>
                  <input value={s.detail} aria-label="Detail" placeholder="What's included" onChange={(e) => edit((d) => void (d.services.items[i].detail = e.target.value))} />
                  <input value={s.eta} aria-label="Response time" placeholder="Response time (e.g. 60-min response)" onChange={(e) => edit((d) => void (d.services.items[i].eta = e.target.value))} />
                </div>
              ))}
              {draft.services.items.length < 8 ? (
                <AddButton
                  onClick={() => edit((d) => void d.services.items.push({ id: `s${Date.now()}`, title: "New service", detail: "", price: "", eta: "" }))}
                >
                  Add service
                </AddButton>
              ) : null}
            </Section>

            <Section title="Instant booking widget">
              <label className="studio-toggle">
                <input type="checkbox" checked={draft.booking.enabled} onChange={(e) => edit((d) => void (d.booking.enabled = e.target.checked))} />
                Show the booking widget
              </label>
              <Field label="Kicker" value={draft.booking.kicker} onChange={(v) => edit((d) => void (d.booking.kicker = v))} />
              <Field label="Headline" value={draft.booking.headline} onChange={(v) => edit((d) => void (d.booking.headline = v))} />
              <Area label="Blurb" rows={2} value={draft.booking.blurb} onChange={(v) => edit((d) => void (d.booking.blurb = v))} />
              {draft.booking.slots.map((slot, i) => (
                <div key={i} className="studio-row">
                  <input value={slot} aria-label="Time slot" onChange={(e) => edit((d) => void (d.booking.slots[i] = e.target.value))} />
                  <IconButton label="Remove slot" onClick={() => edit((d) => void d.booking.slots.splice(i, 1))}>
                    <Trash2 size={14} />
                  </IconButton>
                </div>
              ))}
              {draft.booking.slots.length < 6 ? <AddButton onClick={() => edit((d) => void d.booking.slots.push("New time window"))}>Add time slot</AddButton> : null}
              <Field label="Submit button" value={draft.booking.submitLabel} onChange={(v) => edit((d) => void (d.booking.submitLabel = v))} />
              <Field label="Confirmation title" value={draft.booking.confirmTitle} onChange={(v) => edit((d) => void (d.booking.confirmTitle = v))} />
              <Area label="Confirmation line ({service} and {slot} are filled in)" rows={2} value={draft.booking.confirmBody} onChange={(v) => edit((d) => void (d.booking.confirmBody = v))} />
              <Field label="Preview tag on the confirmation" value={draft.booking.previewLabel} onChange={(v) => edit((d) => void (d.booking.previewLabel = v))} />
            </Section>

            <Section title="Telemetry panel">
              <label className="studio-toggle">
                <input type="checkbox" checked={draft.telemetry.enabled} onChange={(e) => edit((d) => void (d.telemetry.enabled = e.target.checked))} />
                Show the diagnostic telemetry loop
              </label>
              <Field label="Kicker" value={draft.telemetry.kicker} onChange={(v) => edit((d) => void (d.telemetry.kicker = v))} />
              <Field label="Headline" value={draft.telemetry.headline} onChange={(v) => edit((d) => void (d.telemetry.headline = v))} />
              <Area label="Blurb" rows={3} value={draft.telemetry.blurb} onChange={(v) => edit((d) => void (d.telemetry.blurb = v))} />
              {draft.telemetry.points.map((point, i) => (
                <div key={i} className="studio-row">
                  <input value={point} aria-label="Bullet" onChange={(e) => edit((d) => void (d.telemetry.points[i] = e.target.value))} />
                  <IconButton label="Remove bullet" onClick={() => edit((d) => void d.telemetry.points.splice(i, 1))}>
                    <Trash2 size={14} />
                  </IconButton>
                </div>
              ))}
              {draft.telemetry.points.length < 5 ? <AddButton onClick={() => edit((d) => void d.telemetry.points.push("New point"))}>Add bullet</AddButton> : null}
              <Field label="Loop video URL" value={draft.telemetry.videoUrl} onChange={(v) => edit((d) => void (d.telemetry.videoUrl = v))} />
              <Field label="Loop poster URL" value={draft.telemetry.posterUrl} onChange={(v) => edit((d) => void (d.telemetry.posterUrl = v))} />
            </Section>

            <Section title="Social proof" hint="Up to 6">
              <label className="studio-toggle">
                <input type="checkbox" checked={draft.proof.enabled} onChange={(e) => edit((d) => void (d.proof.enabled = e.target.checked))} />
                Show testimonials
              </label>
              <Field label="Kicker" value={draft.proof.kicker} onChange={(v) => edit((d) => void (d.proof.kicker = v))} />
              <Field label="Headline" value={draft.proof.headline} onChange={(v) => edit((d) => void (d.proof.headline = v))} />
              <Field
                label="Sample tag (clear it once these are real customer quotes)"
                value={draft.proof.sampleLabel}
                onChange={(v) => edit((d) => void (d.proof.sampleLabel = v))}
              />
              {draft.proof.items.map((q, i) => (
                <div key={q.id} className="studio-card">
                  <textarea rows={3} value={q.quote} aria-label="Quote" onChange={(e) => edit((d) => void (d.proof.items[i].quote = e.target.value))} />
                  <div className="studio-row">
                    <input value={q.name} aria-label="Name" placeholder="Name" onChange={(e) => edit((d) => void (d.proof.items[i].name = e.target.value))} />
                    <input value={q.role} aria-label="Role" placeholder="Role / shop" onChange={(e) => edit((d) => void (d.proof.items[i].role = e.target.value))} />
                    <IconButton label="Remove quote" onClick={() => edit((d) => void d.proof.items.splice(i, 1))}>
                      <Trash2 size={14} />
                    </IconButton>
                  </div>
                </div>
              ))}
              {draft.proof.items.length < 6 ? (
                <AddButton onClick={() => edit((d) => void d.proof.items.push({ id: `q${Date.now()}`, quote: "New quote", name: "", role: "" }))}>Add quote</AddButton>
              ) : null}
            </Section>

            <Section title="Closing call-to-action">
              <Area label="Headline" rows={2} value={draft.closing.headline} onChange={(v) => edit((d) => void (d.closing.headline = v))} />
              <Area label="Blurb" rows={3} value={draft.closing.blurb} onChange={(v) => edit((d) => void (d.closing.blurb = v))} />
            </Section>
          </div>

          <footer className="studio-foot">
            <button
              type="button"
              className="studio-btn is-quiet"
              onClick={() => {
                if (window.confirm("Reset every field to the template defaults? Nothing is published until you hit Publish.")) {
                  setDraft(DEFAULT_PLUMBER_OUTREACH);
                }
              }}
            >
              <RotateCcw size={14} /> Defaults
            </button>
            <button type="button" className="studio-btn is-quiet" disabled={!dirty} onClick={() => setDraft(published.config)}>
              Discard
            </button>
            <button type="button" className="studio-btn is-primary" disabled={!dirty || saving || Boolean(locked)} onClick={() => void publish()}>
              {locked ? <Lock size={14} /> : <UploadCloud size={14} />}
              {saving ? "Publishing…" : "Publish"}
            </button>
          </footer>
        </aside>

        <section className="studio-preview">
          <div className="studio-preview-bar">
            <div className="studio-seg" role="tablist" aria-label="Preview size">
              <button type="button" aria-pressed={device === "desktop"} onClick={() => setDevice("desktop")}>
                <Laptop size={14} /> Desktop
              </button>
              <button type="button" aria-pressed={device === "mobile"} onClick={() => setDevice("mobile")}>
                <Smartphone size={14} /> Phone
              </button>
            </div>
            <a className="studio-open" href={previewPath(slug, true)} target="_blank" rel="noreferrer">
              Pop-out live preview <ExternalLink size={13} />
            </a>
            <a className="studio-open" href={previewPath(slug, false)} target="_blank" rel="noreferrer">
              Published page <ExternalLink size={13} />
            </a>
          </div>
          <div className={`studio-device is-${device}`}>
            <iframe ref={frame} title="Outreach landing preview" src={previewPath(slug, true)} onLoad={() => push(draftRef.current)} />
          </div>
        </section>
      </div>
    </>
  );
}
