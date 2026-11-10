import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ExternalLink, KeyRound, Laptop, Lock, Plus, RotateCcw, Smartphone, Trash2, UploadCloud } from "lucide-react";
import { toast, Toaster } from "sonner";
import { claimMasterBypass } from "@/lib/axiom/master";
import {
  DEFAULT_PLUMBING_STOREFRONT,
  PLUMBING_DRAFT_CHANNEL,
  PLUMBING_DRAFT_MESSAGE,
  TRUST_ICONS,
  parsePlumbingStorefront,
  type PlumbingStorefront,
  type TrustIcon,
} from "@/lib/axiom/plumbing-storefront";
import { plumbingStudioAccess, savePlumbingStorefront } from "@/lib/axiom/plumbing-storefront.functions";
import type { StorefrontRead } from "@/lib/axiom/plumbing-storefront.server";
import { DispatchControlPanel } from "@/components/master/DispatchControlPanel";

const DRAFT_KEY = "axiom:plumbing-studio-draft";
const PREVIEW_PATH = "/demo/plumbing?studio=1";

const VIDEO_CHOICES = [
  { label: "Axiom plumber hero", url: "/media/axiom-plumber-hero.mp4", mobile: "/media/axiom-plumber-hero-mobile.mp4", poster: "/media/axiom-plumber-hero.jpg" },
  { label: "Axio plumber hero (alias)", url: "/media/axio-plumber-hero.mp4", mobile: "/media/axio-plumber-hero-mobile.mp4", poster: "/media/axio-plumber-hero.jpg" },
  { label: "Plumbers (catalog film)", url: "/media/plumbers-hero-animation.mp4", mobile: "/media/plumbers-hero-animation.mp4", poster: "/media/heroes/plumbing.jpg" },
];

type Access = { ok: boolean; reason: string } | null;

function readLocalDraft(): PlumbingStorefront | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    return raw ? parsePlumbingStorefront(raw) : null;
  } catch {
    return null;
  }
}

function writeLocalDraft(cfg: PlumbingStorefront | null) {
  try {
    if (cfg) window.localStorage.setItem(DRAFT_KEY, JSON.stringify(cfg));
    else window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* storage can be unavailable; the draft still lives in memory */
  }
}

export function PlumbingStudio({ initial }: { initial: StorefrontRead }) {
  const [published, setPublished] = useState(initial);
  const [draft, setDraft] = useState<PlumbingStorefront>(initial.config);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [access, setAccess] = useState<Access>(null);
  const [saving, setSaving] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const channel = useRef<BroadcastChannel | null>(null);
  const draftRef = useRef(draft);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(published.config), [draft, published]);

  // Restore an unpublished draft from this browser.
  useEffect(() => {
    const local = readLocalDraft();
    if (local) setDraft(local);
    void plumbingStudioAccess().then(setAccess).catch(() => setAccess({ ok: false, reason: "locked" }));
  }, []);

  const push = useCallback((cfg: PlumbingStorefront) => {
    const msg = { type: PLUMBING_DRAFT_MESSAGE, config: cfg };
    frame.current?.contentWindow?.postMessage(msg, window.location.origin);
    channel.current?.postMessage(msg);
  }, []);

  useEffect(() => {
    try {
      channel.current = new BroadcastChannel(PLUMBING_DRAFT_CHANNEL);
    } catch {
      channel.current = null;
    }
    const onReady = (event: MessageEvent) => {
      if (event.origin === window.location.origin && event.data?.type === `${PLUMBING_DRAFT_MESSAGE}:ready`) push(draftRef.current);
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

  function edit(mutate: (next: PlumbingStorefront) => void) {
    setDraft((current) => {
      const next = structuredClone(current);
      mutate(next);
      return next;
    });
  }

  async function publish() {
    setSaving(true);
    try {
      const saved = await savePlumbingStorefront({ data: draft });
      setPublished(saved);
      setDraft(saved.config);
      writeLocalDraft(null);
      toast.success("Published — the live storefront is updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not publish.");
      void plumbingStudioAccess().then(setAccess).catch(() => undefined);
    } finally {
      setSaving(false);
    }
  }

  const locked = access && !access.ok;

  return (
    <>
    <Toaster theme="dark" position="top-center" />
    <div className="studio-root">
      <aside className="studio-panel">
        <header className="studio-head">
          <div>
            <p className="studio-kicker">Axiom Master Admin Studio</p>
            <h1 className="studio-title">Emergency Plumbing storefront</h1>
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
          <a className="studio-open" href="/axiom-auto/outreach">
            Edit plumber outreach landing <ExternalLink size={13} />
          </a>
        </header>

        <div className="studio-scroll">
        {locked ? <UnlockCard reason={access.reason} onUnlocked={() => void plumbingStudioAccess().then(setAccess)} /> : null}

        <div className="px-3 pb-4">
          <DispatchControlPanel />
        </div>

        <Section title="Business">
          <Field label="Company name" value={draft.company} onChange={(v) => edit((d) => void (d.company = v))} />
          <Field label="City / service area" value={draft.city} onChange={(v) => edit((d) => void (d.city = v))} />
          <div className="studio-grid-2">
            <Field label="Phone (shown)" value={draft.phoneDisplay} onChange={(v) => edit((d) => void (d.phoneDisplay = v))} />
            <Field
              label="Dial number (optional)"
              placeholder="Same as shown"
              value={draft.phoneDial}
              onChange={(v) => edit((d) => void (d.phoneDial = v))}
            />
          </div>
        </Section>

        <Section title="Hero overlay">
          <Field label="Eyebrow" value={draft.hero.eyebrow} onChange={(v) => edit((d) => void (d.hero.eyebrow = v))} />
          <Area label="Headline" rows={2} value={draft.hero.headline} onChange={(v) => edit((d) => void (d.hero.headline = v))} />
          <Area label="Subhead" rows={3} value={draft.hero.subhead} onChange={(v) => edit((d) => void (d.hero.subhead = v))} />
          <label className="studio-field">
            <span>Hero film</span>
            <select
              value={VIDEO_CHOICES.find((c) => c.url === draft.hero.videoUrl)?.url ?? "custom"}
              onChange={(e) => {
                const pick = VIDEO_CHOICES.find((c) => c.url === e.target.value);
                if (pick) edit((d) => void Object.assign(d.hero, { videoUrl: pick.url, mobileVideoUrl: pick.mobile, posterUrl: pick.poster }));
              }}
            >
              {VIDEO_CHOICES.map((c) => (
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
          <label className="studio-field">
            <span>
              Ambient grade <em>{draft.hero.grade}%</em>
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={draft.hero.grade}
              onChange={(e) => edit((d) => void (d.hero.grade = Number(e.target.value)))}
            />
          </label>
        </Section>

        <Section title="Trust badges" hint="Up to 6">
          {draft.badges.map((b, i) => (
            <div key={b.id} className="studio-row">
              <select
                aria-label="Icon"
                value={b.icon}
                onChange={(e) => edit((d) => void (d.badges[i].icon = e.target.value as TrustIcon))}
              >
                {TRUST_ICONS.map((icon) => (
                  <option key={icon} value={icon}>
                    {icon}
                  </option>
                ))}
              </select>
              <input value={b.label} aria-label="Badge text" onChange={(e) => edit((d) => void (d.badges[i].label = e.target.value))} />
              <IconButton label="Remove badge" onClick={() => edit((d) => void d.badges.splice(i, 1))}>
                <Trash2 size={14} />
              </IconButton>
            </div>
          ))}
          {draft.badges.length < 6 ? (
            <AddButton onClick={() => edit((d) => void d.badges.push({ id: `b${Date.now()}`, icon: "badge", label: "New badge" }))}>Add badge</AddButton>
          ) : null}
        </Section>

        <Section title="Buttons">
          <Field label="Trial button" value={draft.ctas.trialLabel} onChange={(v) => edit((d) => void (d.ctas.trialLabel = v))} />
          <Field label="Trial link" value={draft.ctas.trialHref} onChange={(v) => edit((d) => void (d.ctas.trialHref = v))} />
          <div className="studio-grid-2">
            <Field label="Missed-call button" value={draft.ctas.missedCallLabel} onChange={(v) => edit((d) => void (d.ctas.missedCallLabel = v))} />
            <Field label="Call button" value={draft.ctas.callLabel} onChange={(v) => edit((d) => void (d.ctas.callLabel = v))} />
          </div>
        </Section>

        <Section title="Services" hint="Up to 6">
          {draft.services.map((s, i) => (
            <div key={s.id} className="studio-card">
              <div className="studio-row">
                <input value={s.title} aria-label="Service" onChange={(e) => edit((d) => void (d.services[i].title = e.target.value))} />
                <input className="is-narrow" value={s.price} aria-label="Price" onChange={(e) => edit((d) => void (d.services[i].price = e.target.value))} />
                <IconButton label="Remove service" onClick={() => edit((d) => void d.services.splice(i, 1))}>
                  <Trash2 size={14} />
                </IconButton>
              </div>
              <input value={s.detail} aria-label="Detail" onChange={(e) => edit((d) => void (d.services[i].detail = e.target.value))} />
            </div>
          ))}
          {draft.services.length < 6 ? (
            <AddButton onClick={() => edit((d) => void d.services.push({ id: `s${Date.now()}`, title: "New service", detail: "", price: "" }))}>
              Add service
            </AddButton>
          ) : null}
        </Section>

        <Section title="Social proof feed">
          <label className="studio-toggle">
            <input type="checkbox" checked={draft.proof.enabled} onChange={(e) => edit((d) => void (d.proof.enabled = e.target.checked))} />
            Show floating activity cards
          </label>
          <Field
            label="Sample tag (clear it once these are real bookings)"
            value={draft.proof.sampleLabel}
            onChange={(v) => edit((d) => void (d.proof.sampleLabel = v))}
          />
          {draft.proof.items.map((p, i) => (
            <div key={p.id} className="studio-card">
              <div className="studio-row">
                <input value={p.name} aria-label="Name" onChange={(e) => edit((d) => void (d.proof.items[i].name = e.target.value))} />
                <input value={p.place} aria-label="Town" onChange={(e) => edit((d) => void (d.proof.items[i].place = e.target.value))} />
                <IconButton label="Remove card" onClick={() => edit((d) => void d.proof.items.splice(i, 1))}>
                  <Trash2 size={14} />
                </IconButton>
              </div>
              <div className="studio-row">
                <input value={p.job} aria-label="What happened" onChange={(e) => edit((d) => void (d.proof.items[i].job = e.target.value))} />
                <input className="is-narrow" value={p.ago} aria-label="When" onChange={(e) => edit((d) => void (d.proof.items[i].ago = e.target.value))} />
              </div>
            </div>
          ))}
          {draft.proof.items.length < 8 ? (
            <AddButton
              onClick={() => edit((d) => void d.proof.items.push({ id: `p${Date.now()}`, name: "New customer", place: "", job: "booked a repair", ago: "just now" }))}
            >
              Add card
            </AddButton>
          ) : null}
        </Section>

        <Section title="Missed-call simulation">
          <div className="studio-grid-2">
            <Field label="Caller name" value={draft.missedCall.callerName} onChange={(v) => edit((d) => void (d.missedCall.callerName = v))} />
            <Field label="Booked slot" value={draft.missedCall.bookedSlot} onChange={(v) => edit((d) => void (d.missedCall.bookedSlot = v))} />
          </div>
          <Field label="Caller's problem" value={draft.missedCall.issue} onChange={(v) => edit((d) => void (d.missedCall.issue = v))} />
          <Area
            label="Text-back message — {caller} and {company} fill in"
            rows={3}
            value={draft.missedCall.textBack}
            onChange={(v) => edit((d) => void (d.missedCall.textBack = v))}
          />
        </Section>

        <Section title="Competitor & land-grab" hint="Comparison + territory urgency">
          <label className="studio-toggle">
            <input
              type="checkbox"
              checked={draft.landGrab.comparisonEnabled}
              onChange={(e) => edit((d) => void (d.landGrab.comparisonEnabled = e.target.checked))}
            />
            Show competitor replacement comparison
          </label>
          <label className="studio-toggle">
            <input
              type="checkbox"
              checked={draft.landGrab.bannerEnabled}
              onChange={(e) => edit((d) => void (d.landGrab.bannerEnabled = e.target.checked))}
            />
            Show land-grab territory banner
          </label>
          <label className="studio-toggle">
            <input
              type="checkbox"
              checked={draft.landGrab.requireGreet}
              onChange={(e) => edit((d) => void (d.landGrab.requireGreet = e.target.checked))}
            />
            Only show on greet=1 custom storefront visits
          </label>
          <Field
            label="Comparison headline"
            value={draft.landGrab.headline}
            onChange={(v) => edit((d) => void (d.landGrab.headline = v))}
          />
          <Area
            label="Comparison subhead — {city} / {trade} fill in"
            rows={2}
            value={draft.landGrab.subhead}
            onChange={(v) => edit((d) => void (d.landGrab.subhead = v))}
          />
          <div className="studio-grid-2">
            <Field
              label="Legacy column label"
              value={draft.landGrab.legacyColumn}
              onChange={(v) => edit((d) => void (d.landGrab.legacyColumn = v))}
            />
            <Field
              label="Axiom column label"
              value={draft.landGrab.axiomColumn}
              onChange={(v) => edit((d) => void (d.landGrab.axiomColumn = v))}
            />
          </div>
          {draft.landGrab.rows.map((row, i) => (
            <div key={row.id} className="studio-card">
              <input
                value={row.legacy}
                aria-label="Legacy friction"
                onChange={(e) => edit((d) => void (d.landGrab.rows[i].legacy = e.target.value))}
              />
              <input
                value={row.axiom}
                aria-label="Axiom replacement"
                onChange={(e) => edit((d) => void (d.landGrab.rows[i].axiom = e.target.value))}
              />
              <IconButton label="Remove comparison row" onClick={() => edit((d) => void d.landGrab.rows.splice(i, 1))}>
                <Trash2 size={14} />
              </IconButton>
            </div>
          ))}
          {draft.landGrab.rows.length < 6 ? (
            <AddButton
              onClick={() =>
                edit((d) =>
                  void d.landGrab.rows.push({
                    id: `row${Date.now()}`,
                    legacy: "Old friction point",
                    axiom: "Axiom replacement",
                  }),
                )
              }
            >
              Add comparison row
            </AddButton>
          ) : null}
          <Area
            label="Land-grab banner — {slots} {capacity} {city} {county} {trade}"
            rows={2}
            value={draft.landGrab.bannerTemplate}
            onChange={(v) => edit((d) => void (d.landGrab.bannerTemplate = v))}
          />
          <div className="studio-grid-2">
            <Field
              label="Slots remaining (seed)"
              value={String(draft.landGrab.slotsRemaining)}
              onChange={(v) => edit((d) => void (d.landGrab.slotsRemaining = Number(v) || 1))}
            />
            <Field
              label="Territory capacity"
              value={String(draft.landGrab.capacity)}
              onChange={(v) => edit((d) => void (d.landGrab.capacity = Number(v) || 2))}
            />
          </div>
          <div className="studio-grid-2">
            <Field
              label="Lock-out minutes copy"
              value={String(draft.landGrab.lockMinutes)}
              onChange={(v) => edit((d) => void (d.landGrab.lockMinutes = Number(v) || 1))}
            />
            <Field
              label="Sample tag"
              value={draft.landGrab.sampleLabel}
              onChange={(v) => edit((d) => void (d.landGrab.sampleLabel = v))}
            />
          </div>
          <Field
            label="Comparison CTA label"
            value={draft.landGrab.ctaLabel}
            onChange={(v) => edit((d) => void (d.landGrab.ctaLabel = v))}
          />
          <Field
            label="Comparison CTA link"
            value={draft.landGrab.ctaHref}
            onChange={(v) => edit((d) => void (d.landGrab.ctaHref = v))}
          />
        </Section>

        <Section title="Geo proof & local ticker" hint="City/county bound">
          <label className="studio-toggle">
            <input
              type="checkbox"
              checked={draft.geo.proofEnabled}
              onChange={(e) => edit((d) => void (d.geo.proofEnabled = e.target.checked))}
            />
            Show localized proof-of-work stats
          </label>
          <label className="studio-toggle">
            <input
              type="checkbox"
              checked={draft.geo.tickerEnabled}
              onChange={(e) => edit((d) => void (d.geo.tickerEnabled = e.target.checked))}
            />
            Show live local activity ticker
          </label>
          <Field
            label="Proof headline — {city} / {county} fill in"
            value={draft.geo.headline}
            onChange={(v) => edit((d) => void (d.geo.headline = v))}
          />
          <Area
            label="Proof subhead"
            rows={2}
            value={draft.geo.subhead}
            onChange={(v) => edit((d) => void (d.geo.subhead = v))}
          />
          <div className="studio-grid-2">
            <Field
              label="Seed jobs / week"
              value={String(draft.geo.jobsThisWeek)}
              onChange={(v) => edit((d) => void (d.geo.jobsThisWeek = Number(v) || 0))}
            />
            <Field
              label="Seed response minutes"
              value={String(draft.geo.responseMinutes)}
              onChange={(v) => edit((d) => void (d.geo.responseMinutes = Number(v) || 0))}
            />
          </div>
          <div className="studio-grid-2">
            <Field
              label="Seed activations / month"
              value={String(draft.geo.activationsThisMonth)}
              onChange={(v) => edit((d) => void (d.geo.activationsThisMonth = Number(v) || 0))}
            />
            <Field
              label="Ticker interval (ms)"
              value={String(draft.geo.tickerIntervalMs)}
              onChange={(v) => edit((d) => void (d.geo.tickerIntervalMs = Number(v) || 5200))}
            />
          </div>
          <Field
            label="Sample tag on proof + ticker"
            value={draft.geo.sampleLabel}
            onChange={(v) => edit((d) => void (d.geo.sampleLabel = v))}
          />
          {draft.geo.tickerMessages.map((m, i) => (
            <div key={m.id} className="studio-row">
              <input
                value={m.template}
                aria-label="Ticker message"
                onChange={(e) => edit((d) => void (d.geo.tickerMessages[i].template = e.target.value))}
              />
              <IconButton label="Remove ticker line" onClick={() => edit((d) => void d.geo.tickerMessages.splice(i, 1))}>
                <Trash2 size={14} />
              </IconButton>
            </div>
          ))}
          {draft.geo.tickerMessages.length < 12 ? (
            <AddButton
              onClick={() =>
                edit((d) => void d.geo.tickerMessages.push({ id: `t${Date.now()}`, template: "{name} in {place} {job}" }))
              }
            >
              Add ticker message
            </AddButton>
          ) : null}
        </Section>

        <Section title="ROI calculator" hint="Defaults visitors start with">
          <label className="studio-toggle">
            <input type="checkbox" checked={draft.roi.enabled} onChange={(e) => edit((d) => void (d.roi.enabled = e.target.checked))} />
            Show revenue-loss calculator on the storefront
          </label>
          <Field label="Headline" value={draft.roi.headline} onChange={(v) => edit((d) => void (d.roi.headline = v))} />
          <Area label="Subhead" rows={2} value={draft.roi.subhead} onChange={(v) => edit((d) => void (d.roi.subhead = v))} />
          <div className="studio-grid-2">
            <Field
              label="Default missed calls / week"
              value={String(draft.roi.missedCallsDefault)}
              onChange={(v) => edit((d) => void (d.roi.missedCallsDefault = Number(v) || 0))}
            />
            <Field
              label="Default job value ($)"
              value={String(draft.roi.jobValueDefault)}
              onChange={(v) => edit((d) => void (d.roi.jobValueDefault = Number(v) || 0))}
            />
          </div>
          <div className="studio-grid-2">
            <Field
              label="Missed calls min"
              value={String(draft.roi.missedCallsMin)}
              onChange={(v) => edit((d) => void (d.roi.missedCallsMin = Number(v) || 0))}
            />
            <Field
              label="Missed calls max"
              value={String(draft.roi.missedCallsMax)}
              onChange={(v) => edit((d) => void (d.roi.missedCallsMax = Number(v) || 0))}
            />
          </div>
          <div className="studio-grid-2">
            <Field
              label="Job value min ($)"
              value={String(draft.roi.jobValueMin)}
              onChange={(v) => edit((d) => void (d.roi.jobValueMin = Number(v) || 0))}
            />
            <Field
              label="Job value max ($)"
              value={String(draft.roi.jobValueMax)}
              onChange={(v) => edit((d) => void (d.roi.jobValueMax = Number(v) || 0))}
            />
          </div>
          <div className="studio-grid-2">
            <Field
              label="Job value step ($)"
              value={String(draft.roi.jobValueStep)}
              onChange={(v) => edit((d) => void (d.roi.jobValueStep = Number(v) || 1))}
            />
            <Field
              label="Weeks per month"
              value={String(draft.roi.weeksPerMonth)}
              onChange={(v) => edit((d) => void (d.roi.weeksPerMonth = Number(v) || 4))}
            />
          </div>
          <Area
            label="Hint under the loss figure (ties into Choose Your Price CTA)"
            rows={2}
            value={draft.roi.ctaHint}
            onChange={(v) => edit((d) => void (d.roi.ctaHint = v))}
          />
        </Section>
        </div>

        <footer className="studio-foot">
          <button
            type="button"
            className="studio-btn is-quiet"
            onClick={() => {
              if (window.confirm("Reset every field to the template defaults? Nothing is published until you hit Publish.")) {
                setDraft(DEFAULT_PLUMBING_STOREFRONT);
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
          <a className="studio-open" href={PREVIEW_PATH} target="_blank" rel="noreferrer">
            Pop-out live preview <ExternalLink size={13} />
          </a>
          <a className="studio-open" href="/demo/plumbing" target="_blank" rel="noreferrer">
            Published page <ExternalLink size={13} />
          </a>
        </div>
        <div className={`studio-device is-${device}`}>
          <iframe ref={frame} title="Storefront preview" src={PREVIEW_PATH} onLoad={() => push(draftRef.current)} />
        </div>
      </section>
    </div>
    </>
  );
}

/* ------------------------------------------------------------------ bits */

export function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <details className="studio-section" open>
      <summary>
        {title}
        {hint ? <em>{hint}</em> : null}
      </summary>
      <div className="studio-section-body">{children}</div>
    </details>
  );
}

export function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="studio-field">
      <span>{label}</span>
      <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function Area({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <label className="studio-field">
      <span>{label}</span>
      <textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className="studio-icon" aria-label={label} title={label} onClick={onClick}>
      {children}
    </button>
  );
}

export function AddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className="studio-add" onClick={onClick}>
      <Plus size={14} /> {children}
    </button>
  );
}

export function UnlockCard({ reason, onUnlocked }: { reason: string; onUnlocked: () => void }) {
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  if (reason === "no-key-configured") {
    return (
      <div className="studio-lock">
        <Lock size={16} />
        <p>
          Publishing is locked: set <code>MASTER_ADMIN_BYPASS_KEY</code> (16+ characters) in the environment, then unlock here with it. Preview editing
          still works.
        </p>
      </div>
    );
  }
  return (
    <form
      className="studio-lock"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await claimMasterBypass({ data: { key } });
          setKey("");
          toast.success("Studio unlocked on this device.");
          onUnlocked();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "That key does not open the studio.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <KeyRound size={16} />
      <input type="password" autoComplete="current-password" placeholder="Owner key to publish" value={key} onChange={(e) => setKey(e.target.value)} />
      <button type="submit" className="studio-btn is-primary" disabled={busy || key.trim().length < 16}>
        Unlock
      </button>
    </form>
  );
}
