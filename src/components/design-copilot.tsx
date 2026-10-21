import { useEffect, useId, useState } from "react";
import { confirmCopilot, readCopilot, saveCopilotFeedback, sendCopilot, stageCopilotPreview } from "@/lib/axiom/copilot-api";
import {
  applyStylePatch,
  emptyPatch,
  parseStylePatch,
  publicHeroUrl,
  STAGE_LIBRARY,
  stagingFrame,
  styleDiff,
  type CopilotDesk,
  type CopilotHeroPreview,
  type StyleTokenPatch,
} from "@/lib/axiom/copilot";
import { BLUR_STEPS, CARD_STEPS, DEFAULT_HUD, FADE_STEPS, GLOW_STEPS, hudVars, type StorefrontHud } from "@/lib/axiom/hud";

const FILM = /\.(mp4|webm|mov)(?:$|[?#])/i;

const SUGGESTIONS = [
  "Soften the edge feather and warm the glow",
  "Make the hero more aggressive and match our accent",
  "Turn border glow off and lift the card opacity",
];

type ChatMessage = { id: string; role: "user" | "assistant"; content: string };

type Pending = {
  summary: string;
  style: StyleTokenPatch;
  hero: CopilotHeroPreview | null;
  brandNote: string;
};

type TokenForm = {
  accent: string;
  edgeFeather: string;
  glow: string;
  cardOpacity: string;
  blur: string;
  borderGlow: boolean;
  headline: string;
};

function formFromLook(accent: string, hud: StorefrontHud): TokenForm {
  return {
    accent,
    edgeFeather: String(hud.fade),
    glow: String(hud.glow),
    cardOpacity: String(CARD_STEPS[hud.card] ?? CARD_STEPS[1]),
    blur: String(BLUR_STEPS[hud.blur] ?? BLUR_STEPS[1]),
    borderGlow: hud.rim,
    headline: hud.headline,
  };
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}

function patchFromForm(form: TokenForm): StyleTokenPatch {
  return parseStylePatch({
    accent: form.accent,
    edgeFeather: Number(form.edgeFeather),
    glow: Number(form.glow),
    cardOpacity: Number(form.cardOpacity),
    blur: Number(form.blur),
    borderGlow: form.borderGlow,
    headline: form.headline,
  });
}

function onlyChanged(look: { accent: string; hud: StorefrontHud }, style: StyleTokenPatch): StyleTokenPatch {
  const next: StyleTokenPatch = {};
  for (const line of styleDiff(look, style)) {
    if (line.field === "accent" && style.accent) next.accent = style.accent;
    if (line.field === "edgeFeather" && style.edgeFeather !== undefined) next.edgeFeather = style.edgeFeather;
    if (line.field === "glow" && style.glow !== undefined) next.glow = style.glow;
    if (line.field === "cardOpacity" && style.cardOpacity !== undefined) next.cardOpacity = style.cardOpacity;
    if (line.field === "blur" && style.blur !== undefined) next.blur = style.blur;
    if (line.field === "borderGlow" && style.borderGlow !== undefined) next.borderGlow = style.borderGlow;
    if (line.field === "headline" && style.headline !== undefined) next.headline = style.headline;
  }
  return next;
}

export function DesignCopilot({
  slug,
  readonly,
  onApplied,
}: {
  slug: string;
  readonly: boolean;
  onApplied: () => void;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [desk, setDesk] = useState<CopilotDesk | null>(null);
  const [loadError, setLoadError] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);
  const [saveNote, setSaveNote] = useState(false);
  const [applying, setApplying] = useState(false);
  const [notice, setNotice] = useState("");
  const [feedback, setFeedback] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [tokensOpen, setTokensOpen] = useState(false);
  const [form, setForm] = useState<TokenForm>(() => formFromLook("", DEFAULT_HUD));
  const [mode, setMode] = useState<"staging" | "live">("staging");
  const [stagingMedia, setStagingMedia] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void readCopilot({ data: slug })
      .then((next) => {
        if (cancelled) return;
        setDesk(next);
        const overlay = applyStylePatch(next.look.hud, next.memory.styleTokens);
        setForm(formFromLook(next.memory.styleTokens.accent || next.look.accent, overlay));
        setFeedback(next.memory.feedback);
        setLoadError("");
        if (!next.available) setTokensOpen(true);
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(messageOf(err));
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || sending || readonly) return;
    setSending(true);
    setError("");
    setNotice("");
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", content: message }]);
    setDraft("");
    try {
      const history = messages.map((item) => ({ role: item.role, content: item.content }));
      const result = await sendCopilot({ data: { slug, message, history } });
      setDesk((current) =>
        current
          ? { ...current, available: result.available, look: result.look, memory: result.memory }
          : {
              available: result.available,
              shopName: "",
              look: result.look,
              memory: result.memory,
            },
      );
      if (!result.ok) {
        if (result.available) setError(result.error);
        else setTokensOpen(true);
        return;
      }
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: result.reply }]);
      if (!emptyPatch(result.style)) {
        const nextHud = applyStylePatch(result.look.hud, result.style);
        setForm(formFromLook(result.style.accent || result.look.accent, nextHud));
        setMode("staging");
      } else if (result.hero) {
        setMode("staging");
      }
      const hasAction = !emptyPatch(result.style) || result.hero;
      if (hasAction) {
        setPending({
          summary: result.hero?.prompt || result.reply,
          style: result.style,
          hero: result.hero,
          brandNote: result.brandNote,
        });
        setSaveNote(Boolean(result.brandNote));
      } else {
        setPending(null);
      }
    } catch (err: unknown) {
      setError(messageOf(err));
    } finally {
      setSending(false);
    }
  }

  function reviewTokens() {
    if (!desk) return;
    const style = parseStylePatch({
      accent: form.accent,
      edgeFeather: Number(form.edgeFeather),
      glow: Number(form.glow),
      cardOpacity: Number(form.cardOpacity),
      blur: Number(form.blur),
      borderGlow: form.borderGlow,
      headline: form.headline,
    });
    const changed = onlyChanged(desk.look, style);
    if (emptyPatch(changed)) {
      setError("Those tokens already match the preview.");
      setPending(null);
      return;
    }
    setError("");
    setPending({ summary: "Manual style tokens", style: changed, hero: null, brandNote: "" });
    setSaveNote(false);
  }

  async function stageFilm(id: string) {
    if (readonly || stagingMedia) return;
    setStagingMedia(true);
    setError("");
    setMode("staging");
    try {
      const result = await stageCopilotPreview({ data: { slug, libraryId: id, style: patchFromForm(form) } });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDesk((current) => (current ? { ...current, look: result.look, memory: result.memory } : current));
      setNotice("Staged. The public shop still shows the last confirmed hero.");
    } catch (err: unknown) {
      setError(messageOf(err));
    } finally {
      setStagingMedia(false);
    }
  }

  async function confirmStaging() {
    if (applying || readonly) return;
    setApplying(true);
    setError("");
    try {
      const result = await confirmCopilot({
        data: {
          slug,
          style: patchFromForm(form),
          assetUrl: "",
          summary: pending?.summary || desk?.memory.stagedHero?.prompt || "Confirmed staging",
          brandNote: saveNote ? pending?.brandNote ?? "" : "",
        },
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDesk((current) => (current ? { ...current, look: result.look, memory: result.memory } : current));
      setForm(formFromLook(result.look.accent, result.look.hud));
      setPending(null);
      setMode("live");
      setNotice(result.applied ? "Confirmed. The public shop now uses this hero and these tokens." : "Saved the brand note.");
      if (result.applied) onApplied();
    } catch (err: unknown) {
      setError(messageOf(err));
    } finally {
      setApplying(false);
    }
  }

  async function saveFeedback() {
    const text = feedback.trim();
    if (!text || savingNote || readonly) return;
    setSavingNote(true);
    setError("");
    try {
      const result = await saveCopilotFeedback({ data: { slug, feedback: text } });
      setDesk((current) => (current ? { ...current, memory: result.memory } : current));
      setNotice("Saved that note for the next conversation.");
    } catch (err: unknown) {
      setError(messageOf(err));
    } finally {
      setSavingNote(false);
    }
  }

  const look = desk?.look ?? { accent: "", hud: DEFAULT_HUD };
  const diff = pending ? styleDiff(look, pending.style) : [];
  const tokenPatch = patchFromForm(form);
  const stagedNow = mode === "staging" ? (desk?.memory.stagedHero ?? null) : null;
  const frame = stagingFrame(look.hud, look.accent, mode === "staging" ? tokenPatch : {}, stagedNow);
  const shownUrl = mode === "live" ? publicHeroUrl(look.hud, "") : frame.previewUrl;

  return (
    <div className="fixed bottom-4 left-4 z-30 w-[min(24rem,calc(100vw-2rem))]">
      {open ? (
        <section className="flex max-h-[min(36rem,72dvh)] flex-col overflow-hidden rounded-[24px] bg-surface shadow-[0_0_0_1px_rgba(243,241,235,0.08)]">
          <header className="flex items-start justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Design partner</p>
              <p className="mt-1 font-display text-2xl">Look, then confirm</p>
            </div>
            <button type="button" className="h-11 cursor-pointer rounded-xl px-3 text-sm text-muted" onClick={() => setOpen(false)}>
              Close
            </button>
          </header>
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 pb-4">
            <p className="text-sm text-muted">Staging updates here immediately. The public shop keeps the last confirmed hero until you confirm.</p>
            <div className="flex gap-2" role="group" aria-label="Preview mode">
              <button
                type="button"
                aria-pressed={mode === "staging"}
                className={
                  mode === "staging"
                    ? "inline-flex h-11 cursor-pointer items-center rounded-full bg-fg px-4 text-sm text-bg"
                    : "inline-flex h-11 cursor-pointer items-center rounded-full bg-surface-2 px-4 text-sm text-muted"
                }
                onClick={() => setMode("staging")}
              >
                Staging
              </button>
              <button
                type="button"
                aria-pressed={mode === "live"}
                className={
                  mode === "live"
                    ? "inline-flex h-11 cursor-pointer items-center rounded-full bg-fg px-4 text-sm text-bg"
                    : "inline-flex h-11 cursor-pointer items-center rounded-full bg-surface-2 px-4 text-sm text-muted"
                }
                onClick={() => setMode("live")}
              >
                Live
              </button>
            </div>
            <div className="overflow-hidden rounded-xl bg-surface-2" style={hudVars(frame.hud, frame.accent)}>
              <p className="px-3 pt-3 text-[11px] uppercase tracking-[0.2em] text-muted">
                {mode === "staging" ? "Staging preview" : "Live hero"}
              </p>
              {shownUrl && FILM.test(shownUrl) ? (
                <video src={shownUrl} controls muted playsInline loop className="mt-3 h-36 w-full object-cover" />
              ) : shownUrl ? (
                <img src={shownUrl} alt="" className="mt-3 h-36 w-full object-cover" />
              ) : (
                <p className="px-3 py-6 text-sm text-muted">
                  {mode === "staging"
                    ? "Pick a leopard, bear, kayak, or Sasquatch film, or generate one. This does not change the public shop."
                    : "The public shop is still on its last confirmed hero."}
                </p>
              )}
              <p className="px-3 py-2 text-xs text-muted">
                Accent {frame.accent || "—"} · feather {frame.hud.fade}% · glow {frame.hud.glow} · blur{" "}
                {BLUR_STEPS[frame.hud.blur] ?? BLUR_STEPS[1]}px
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {STAGE_LIBRARY.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="inline-flex h-11 cursor-pointer items-center rounded-full bg-surface-2 px-4 text-sm text-fg disabled:cursor-default disabled:opacity-40"
                  disabled={readonly || stagingMedia}
                  onClick={() => void stageFilm(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-fg px-4 text-sm font-medium text-bg disabled:cursor-default disabled:opacity-40"
              disabled={readonly || applying}
              onClick={() => void confirmStaging()}
            >
              {applying ? "Confirming" : "Confirm on the public shop"}
            </button>
            {readonly ? <p className="text-sm text-muted">This console is a preview. Style changes stay off.</p> : null}
            {loadError ? (
              <p className="text-sm text-copper" role="alert">
                {loadError}
              </p>
            ) : null}
            {desk && !desk.available ? (
              <p className="text-sm text-fg" role="status">
                Generation is unavailable in this environment. You can still set style tokens and apply them here.
              </p>
            ) : null}
            {desk?.memory.brandNotes ? <p className="text-sm text-muted">Brand note: {desk.memory.brandNotes}</p> : null}
            {desk?.memory.confirmedColors.length ? (
              <p className="text-sm text-muted">Confirmed colors: {desk.memory.confirmedColors.join(" ")}</p>
            ) : null}
            {desk?.memory.aesthetic ? <p className="text-sm text-muted">Aesthetic: {desk.memory.aesthetic}</p> : null}
            {desk?.memory.latestSummary ? <p className="text-sm text-muted">Last confirmed look: {desk.memory.latestSummary}</p> : null}
            <div id={listId} className="grid gap-2" aria-live="polite">
              {messages.length === 0 ? (
                <p className="rounded-xl bg-surface-2 px-3 py-3 text-sm text-muted">
                  {desk?.memory.pastPrompts.length
                    ? `Recent asks: ${desk.memory.pastPrompts.slice(-3).join(" · ")}`
                    : "No messages yet. Ask for a look, or set the tokens yourself."}
                </p>
              ) : (
                messages.map((item) => (
                  <p
                    key={item.id}
                    className={
                      item.role === "user"
                        ? "rounded-xl bg-surface-2 px-3 py-2 text-sm text-fg"
                        : "rounded-xl px-3 py-2 text-sm text-muted"
                    }
                  >
                    {item.content}
                  </p>
                ))
              )}
              {sending ? <p className="text-sm text-muted">Working…</p> : null}
            </div>
            {error ? (
              <p className="text-sm text-copper" role="alert">
                {error}
              </p>
            ) : null}
            {notice ? <p className="text-sm text-ok">{notice}</p> : null}
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="cursor-pointer rounded-full px-3 py-2 text-left text-xs text-muted shadow-[0_0_0_1px_rgba(243,241,235,0.08)] disabled:cursor-default disabled:opacity-40"
                  disabled={readonly || sending || !desk?.available}
                  onClick={() => void send(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
            <form
              className="grid gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void send(draft);
              }}
            >
              <label className="text-sm text-muted" htmlFor="copilot-draft">
                Message
                <textarea
                  id="copilot-draft"
                  value={draft}
                  maxLength={500}
                  disabled={readonly || sending}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Describe the look"
                  className="mt-2 min-h-20 w-full rounded-xl bg-surface-2 px-3 py-2 text-sm text-fg"
                />
              </label>
              <button
                type="submit"
                className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-fg px-4 text-sm font-medium text-bg disabled:cursor-default disabled:opacity-40"
                disabled={readonly || sending || !draft.trim() || !desk?.available}
              >
                {sending ? "Sending" : "Send"}
              </button>
            </form>
            <button
              type="button"
              className="h-11 cursor-pointer text-left text-sm text-muted"
              onClick={() => setTokensOpen((value) => !value)}
            >
              {tokensOpen ? "Hide style tokens" : "Set style tokens"}
            </button>
            {tokensOpen ? (
              <div className="grid gap-3">
                <label className="text-sm text-muted">
                  Accent hex
                  <input
                    value={form.accent}
                    disabled={readonly}
                    onChange={(event) => setForm({ ...form, accent: event.target.value })}
                    placeholder="#3366FF"
                    className="mt-2 h-11 w-full rounded-xl bg-surface-2 px-3 text-sm text-fg"
                  />
                </label>
                <StepSelect
                  label="Edge feather"
                  value={form.edgeFeather}
                  options={FADE_STEPS.map((step) => ({ value: String(step), label: `${step}%` }))}
                  disabled={readonly}
                  onChange={(edgeFeather) => setForm({ ...form, edgeFeather })}
                />
                <StepSelect
                  label="Neon glow"
                  value={form.glow}
                  options={GLOW_STEPS.map((step) => ({ value: String(step), label: String(step) }))}
                  disabled={readonly}
                  onChange={(glow) => setForm({ ...form, glow })}
                />
                <StepSelect
                  label="Card opacity"
                  value={form.cardOpacity}
                  options={CARD_STEPS.map((step) => ({ value: String(step), label: `${Math.round(step * 100)}%` }))}
                  disabled={readonly}
                  onChange={(cardOpacity) => setForm({ ...form, cardOpacity })}
                />
                <StepSelect
                  label="Blur threshold"
                  value={form.blur}
                  options={BLUR_STEPS.map((step) => ({ value: String(step), label: `${step}px` }))}
                  disabled={readonly}
                  onChange={(blur) => setForm({ ...form, blur })}
                />
                <label className="text-sm text-muted">
                  Headline
                  <input
                    value={form.headline}
                    maxLength={140}
                    disabled={readonly}
                    onChange={(event) => setForm({ ...form, headline: event.target.value })}
                    className="mt-2 h-11 w-full rounded-xl bg-surface-2 px-3 text-sm text-fg"
                  />
                </label>
                <label className="flex h-11 cursor-pointer items-center gap-2 text-sm text-muted">
                  <input
                    type="checkbox"
                    checked={form.borderGlow}
                    disabled={readonly}
                    onChange={(event) => setForm({ ...form, borderGlow: event.target.checked })}
                  />
                  Border glow
                </label>
                <button
                  type="button"
                  className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl px-4 text-sm text-fg shadow-[0_0_0_1px_rgba(243,241,235,0.08)] disabled:cursor-default disabled:opacity-40"
                  disabled={readonly}
                  onClick={reviewTokens}
                >
                  Review tokens
                </button>
              </div>
            ) : null}
            {pending ? (
              <div className="rounded-xl bg-surface-2 p-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Confirm before preview</p>
                <p className="mt-2 text-sm text-fg">{pending.summary}</p>
                {diff.length ? (
                  <ul className="mt-3 grid gap-1 text-sm">
                    {diff.map((line) => (
                      <li key={line.field}>
                        {line.label}: {line.from} → {line.to}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-muted">No style change.</p>
                )}
                {pending.hero?.assetUrl ? (
                  <p className="mt-3 text-sm text-muted">Staging only. This image is not on the public storefront.</p>
                ) : null}
                {pending.hero?.assetUrl && pending.hero.medium === "image" ? (
                  <img src={pending.hero.assetUrl} alt="Staged hero" className="mt-3 h-36 w-full rounded-xl object-cover" />
                ) : null}
                {pending.hero?.assetUrl && pending.hero.medium === "video" ? (
                  <video src={pending.hero.assetUrl} controls muted playsInline className="mt-3 h-36 w-full rounded-xl" />
                ) : null}
                {pending.hero && !pending.hero.assetUrl ? (
                  <p className="mt-3 text-sm text-muted">No asset came back. The style can still be applied.</p>
                ) : null}
                <p className="mt-3 text-xs text-muted">
                  Edge {frame.hud.fade}% · glow {frame.hud.glow} · blur {BLUR_STEPS[frame.hud.blur] ?? BLUR_STEPS[1]}px · border {frame.hud.rim ? "on" : "off"}
                </p>
                {pending.brandNote ? (
                  <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm text-muted">
                    <input type="checkbox" checked={saveNote} onChange={(event) => setSaveNote(event.target.checked)} />
                    Save brand note: {pending.brandNote}
                  </label>
                ) : null}
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    className="inline-flex h-11 flex-1 cursor-pointer items-center justify-center rounded-xl bg-fg px-3 text-sm font-medium text-bg disabled:cursor-default disabled:opacity-40"
                    disabled={readonly || applying}
                    onClick={() => void confirmStaging()}
                  >
                    {applying ? "Confirming" : "Confirm staging"}
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl px-3 text-sm text-muted"
                    onClick={() => setPending(null)}
                  >
                    Discard
                  </button>
                </div>
              </div>
            ) : null}
            {desk?.memory.stagedHero ? (
              <div className="rounded-xl bg-surface-2 p-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Staged hero</p>
                <p className="mt-2 text-sm text-muted">Not on the public storefront until you confirm it.</p>
                <p className="mt-2 text-sm text-fg">{desk.memory.stagedHero.prompt}</p>
                {desk.memory.stagedHero.medium === "video" ? (
                  <video src={desk.memory.stagedHero.url} controls muted playsInline className="mt-3 h-36 w-full rounded-xl" />
                ) : (
                  <img src={desk.memory.stagedHero.url} alt="Staged hero" className="mt-3 h-36 w-full rounded-xl object-cover" />
                )}
                <button
                  type="button"
                  className="mt-3 inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-xl bg-fg px-3 text-sm font-medium text-bg disabled:cursor-default disabled:opacity-40"
                  disabled={readonly || applying}
                  onClick={() => void confirmStaging()}
                >
                  {applying ? "Confirming" : "Confirm on the public shop"}
                </button>
              </div>
            ) : null}
            <label className="text-sm text-muted" htmlFor="copilot-feedback">
              Note for next time
              <textarea
                id="copilot-feedback"
                value={feedback}
                maxLength={400}
                disabled={readonly || savingNote}
                onChange={(event) => setFeedback(event.target.value)}
                placeholder="What should the next look remember?"
                className="mt-2 min-h-16 w-full rounded-xl bg-surface-2 px-3 py-2 text-sm text-fg"
              />
            </label>
            <button
              type="button"
              className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl px-4 text-sm text-fg shadow-[0_0_0_1px_rgba(243,241,235,0.08)] disabled:cursor-default disabled:opacity-40"
              disabled={readonly || savingNote || !feedback.trim()}
              onClick={() => void saveFeedback()}
            >
              {savingNote ? "Saving" : "Save feedback"}
            </button>
          </div>
        </section>
      ) : (
        <button
          type="button"
          className="inline-flex h-11 cursor-pointer items-center rounded-full bg-surface px-4 text-sm text-fg shadow-[0_0_0_1px_rgba(243,241,235,0.08)]"
          onClick={() => setOpen(true)}
        >
          Design partner
        </button>
      )}
    </div>
  );
}

function StepSelect({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm text-muted">
      {label}
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full cursor-pointer rounded-xl bg-surface-2 px-3 text-sm text-fg"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
