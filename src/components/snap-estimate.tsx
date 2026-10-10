import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { Input, Label } from "@/components/ui/input";
import { formatMoney } from "@/lib/utils";
import { ensureFunnelSession, recordFunnelHit } from "@/lib/axiom/master";
import { submitAudit } from "@/lib/axiom/server";
import type { ShopNiche } from "@/lib/axiom/types";
import { estimateRange, impactScore, quoteProfile, serviceLane, type JobLane } from "@/lib/axiom/storefront";

const AUDIT_STEPS = ["Analyzing wear...", "Calculating impact score...", "Building the bracket..."];

export function NeonField({ active }: { active: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current?.parentElement;
    if (!node || !active) return;
    const paint = () => {
      const depth = Math.min(1, window.scrollY / 480);
      node.style.setProperty("--glow", String(0.35 + depth * 0.65));
    };
    paint();
    window.addEventListener("scroll", paint, { passive: true });
    return () => window.removeEventListener("scroll", paint);
  }, [active]);
  return <div ref={ref} hidden />;
}

export function SnapEstimate({
  lines,
  bookTo,
  niche = "trade",
  bookLabel = "Book now",
  shopSlug = "",
  leadSlug = "",
}: {
  lines: { name: string; description: string; priceCents: number }[];
  bookTo?: string;
  niche?: ShopNiche;
  bookLabel?: string;
  shopSlug?: string;
  leadSlug?: string;
}) {
  const profile = quoteProfile(niche);
  const [laneId, setLaneId] = useState(profile.lanes[0]?.id ?? "");
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState("");
  const [note, setNote] = useState("");
  const [phase, setPhase] = useState<"idle" | "scan" | "ready">("idle");
  const [step, setStep] = useState(-1);
  const [channel, setChannel] = useState<"text" | "email">("text");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState("");
  const [sendError, setSendError] = useState("");
  const lane = profile.lanes.find((item) => item.id === laneId) ?? profile.lanes[0];
  const tagged = useMemo(
    () => lines.map((line) => ({ ...line, lane: serviceLane(line.name, line.description) })),
    [lines],
  );
  const keyword = profile.filter === "keyword" && lane ? lane.id : "";
  const visible = keyword ? tagged.filter((line) => line.lane === (keyword as JobLane)) : lines;
  const priced = (visible.length > 0 ? visible : lines).map((line) => line.priceCents);
  const photoReady = profile.photo === "off" || phase === "ready";
  const range = photoReady && lane ? estimateRange(priced, lane.multiplier) : null;
  const impact = range && lane ? impactScore(lane.multiplier, range.low, range.high) : 0;
  const splitNote = fileName && keyword && visible.length === 0 ? profile.emptyLane : "";

  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  function markTried() {
    if (!leadSlug) return;
    const key = `axiom.snap:${leadSlug}`;
    if (sessionStorage.getItem(key) === "1") return;
    sessionStorage.setItem(key, "1");
    void ensureFunnelSession()
      .then(() => recordFunnelHit({ data: { leadSlug, utmSource: "snap" } }))
      .catch(() => undefined);
  }

  useEffect(() => {
    if (phase === "ready") markTried();
  }, [phase, leadSlug]);

  useEffect(() => {
    if (!fileName) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setStep(AUDIT_STEPS.length - 1);
      setPhase("ready");
      return;
    }
    setPhase("scan");
    setStep(0);
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      if (index >= AUDIT_STEPS.length) {
        setPhase("ready");
        window.clearInterval(timer);
        return;
      }
      setStep(index);
    }, 800);
    return () => window.clearInterval(timer);
  }, [fileName]);

  return (
    <section className="lift-card rounded-[28px] bg-surface/80 p-5 shadow-[0_0_0_1px_rgba(243,241,235,0.08)] backdrop-blur-md sm:p-6">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">{profile.kicker}</p>
      <h2 className="mt-2 font-display text-3xl">{profile.heading}</h2>
      <p className="mt-2 max-w-lg text-sm text-muted">{profile.helper}</p>
      {profile.lanes.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {profile.lanes.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={lane?.id === item.id}
              onClick={() => {
                setLaneId(item.id);
                markTried();
              }}
              className={`glass-btn h-11 rounded-full px-4 text-sm ${lane?.id === item.id ? "text-fg" : "text-muted"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
      <label className="audit-well mt-4 flex min-h-44 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl bg-surface-2/80 px-4 py-6 text-sm font-medium">
        {preview ? (
          <img src={preview} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <>
            <ImagePlus className="relative size-4" aria-hidden />
            <span className="relative">Upload photo for instant estimate</span>
          </>
        )}
        <span className="audit-laser" aria-hidden />
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            if (!file.type.startsWith("image/")) {
              setNote(profile.photoNote || "Use a photo.");
              return;
            }
            setSent("");
            setSendError("");
            setFileName(`${file.name}:${file.size}:${file.lastModified}`);
            setPreview(URL.createObjectURL(file));
            setNote("");
          }}
        />
      </label>
      {phase === "scan" ? (
        <ol className="mt-4 grid gap-1">
          {AUDIT_STEPS.map((label, index) => (
            <li key={label} className={index <= step ? "text-sm text-fg" : "text-sm text-faint"}>
              {label}
            </li>
          ))}
        </ol>
      ) : null}
      {note || splitNote ? <p className="mt-3 text-sm text-muted">{note || splitNote}</p> : null}
      {profile.photo === "required" && phase === "idle" ? (
        <p className="mt-3 text-sm text-faint">Add a photo before the range appears.</p>
      ) : range && phase === "ready" ? (
        <div className="mt-4">
          <p className="font-display text-3xl tabular">
            {range.low === range.high ? formatMoney(range.low) : `${formatMoney(range.low)} – ${formatMoney(range.high)}`}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-line text-sm">
            <p className="bg-surface-2 px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-muted">Before</p>
            <p className="bg-surface-2 px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-muted">After</p>
            <p className="bg-surface px-3 py-3 text-muted">Unscoped photo</p>
            <p className="bg-surface px-3 py-3">{lane?.label}</p>
            <p className="bg-surface px-3 py-3 text-muted">Impact open</p>
            <p className="bg-surface px-3 py-3 tabular">{impact}</p>
            <p className="bg-surface px-3 py-3 text-muted">Price open</p>
            <p className="bg-surface px-3 py-3 tabular">
              {range.low === range.high ? formatMoney(range.low) : `${formatMoney(range.low)}–${formatMoney(range.high)}`}
            </p>
          </div>
          <p className="mt-3 text-sm text-muted">The score is a bracket from this shop&apos;s prices. The photo stays on this device.</p>
          <form
            className="mt-4 grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (!lane || sending) return;
              setSending(true);
              setSendError("");
              void submitAudit({
                data: {
                  shopSlug,
                  leadSlug,
                  name,
                  channel,
                  contact,
                  lane: lane.label,
                  lowCents: range.low,
                  highCents: range.high,
                  impact,
                },
              })
                .then((result) => {
                  if (result.id) sessionStorage.setItem("axiom:audit-watch", result.id);
                  setSent(
                    result.delivered
                      ? "Saved on the shop's desk. They have the bracket and how to reach you."
                      : "Saved with this business. The desk gets it when the shop is open.",
                  );
                })
                .catch((err: unknown) => setSendError(err instanceof Error ? err.message : "Could not save the audit"))
                .finally(() => setSending(false));
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="audit-name">Name</Label>
              <Input id="audit-name" value={name} onChange={(event) => setName(event.target.value)} required />
            </div>
            <div className="flex flex-wrap gap-2">
              {(["text", "email"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={channel === item}
                  onClick={() => setChannel(item)}
                  className={`glass-btn h-11 rounded-full px-4 text-sm ${channel === item ? "text-fg" : "text-muted"}`}
                >
                  {item === "text" ? "Text" : "Email"}
                </button>
              ))}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="audit-contact">{channel === "text" ? "Mobile" : "Email"}</Label>
              <Input
                id="audit-contact"
                type={channel === "text" ? "tel" : "email"}
                value={contact}
                onChange={(event) => setContact(event.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={sending} className="glass-btn h-12 rounded-xl px-5 text-sm font-medium">
              {sending ? "Saving" : channel === "text" ? "Text me this audit report" : "Email me this audit report"}
            </button>
            {sendError ? <p className="text-sm text-danger">{sendError}</p> : null}
            {sent ? <p className="text-sm text-muted">{sent}</p> : null}
          </form>
        </div>
      ) : profile.photo === "off" && range ? (
        <p className="mt-4 font-display text-3xl tabular">
          {range.low === range.high ? formatMoney(range.low) : `${formatMoney(range.low)} – ${formatMoney(range.high)}`}
        </p>
      ) : phase === "ready" ? (
        <p className="mt-3 text-sm text-muted">This menu has no priced lines yet.</p>
      ) : null}
      {bookTo ? (
        <a href={bookTo} className="glass-btn mt-4 inline-flex h-12 items-center rounded-xl px-5 text-sm font-medium">
          {bookLabel}
        </a>
      ) : null}
    </section>
  );
}
