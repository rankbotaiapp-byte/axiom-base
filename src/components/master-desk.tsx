import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, Navigate, useNavigate, useRouterState, useSearch } from "@tanstack/react-router";
import { ArrowUpRight, Copy, Mail, Radio, Smartphone } from "lucide-react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  isEmailReady,
  isSmsReady,
  leadChannelTags,
  leadPublicTags,
  OUTREACH_STRATEGIES,
  outreachPublicTokens,
  outreachStrategy,
  renderOutreachMessage,
  type OutreachStrategyId,
} from "@/lib/axiom/funnel";
import {
  addPreloadedLeads,
  createOutreachFunnel,
  generateRegionalFunnel,
  listOutreachFunnels,
  claimMasterBypass,
  getMasterDesk,
  launchOutreachBatch,
  masterEntry,
  preloadRegionalRoster,
  previewOutreach,
  recordMasterDeskOpen,
} from "@/lib/axiom/master";
import { nicheLabel, sortLeads, type LeadSort } from "@/lib/axiom/directory";
import { NICHE_ORDER, NICHES, PUBLIC_NICHE_ORDER } from "@/lib/axiom/niches";
import { pitchHref } from "@/lib/axiom/pricing";
import {
  formatSendSlot,
  nextSendInstant,
  sendWindowBlurb,
  timingProfileFor,
  type SendTiming,
} from "@/lib/axiom/outreach-queue";
import { HOME_REGION_COUNTIES, HOME_REGION_LABEL } from "@/lib/axiom/regional-roster";
import { isShopNiche, type ShopNiche } from "@/lib/axiom/types";
import { AutopilotCard } from "@/components/master/AutopilotCard";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { FeedbackToggles } from "@/components/feedback-toggles";
import { Wordmark } from "@/components/shop-chrome";
import { pulseHaptic, readFeedback } from "@/lib/axiom/feedback";
import { listPlatformPulse, type PlatformPulse } from "@/lib/axiom/master";
import { createLeadCsvReader, IMPORT_BATCH, importBulkLeads, importRegistrySweep, leadCsvChunks, type BulkImportResult } from "@/lib/axiom/bulk-import";
import { SWEEP_PER_COUNTY } from "@/lib/axiom/registry-sweep";
import { formatMoney } from "@/lib/utils";
import { nicheFilmCatalog } from "@/lib/axiom/media";
import { catalogChoices, readMasterTelemetry, readNicheOverrides, writeMasterTelemetry, writeNicheFilmOverride } from "@/lib/axiom/hero-films";

type Desk = Awaited<ReturnType<typeof getMasterDesk>>;
type FunnelLinks = Awaited<ReturnType<typeof generateRegionalFunnel>>;

function stayOnDesk(pathname: string): "/admin" | "/master" | "/master-admin" {
  if (pathname === "/admin") return "/admin";
  if (pathname.startsWith("/master-admin")) return "/master-admin";
  return "/master";
}

function HeroFilmPanel() {
  const films = useMemo(() => nicheFilmCatalog(), []);
  const [lines, setLines] = useState(["", "", ""]);
  const [saved, setSaved] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  useEffect(() => {
    const stored = readMasterTelemetry();
    setLines([stored[0] ?? "", stored[1] ?? "", stored[2] ?? ""]);
    setOverrides(readNicheOverrides());
  }, []);

  return (
    <section className="mt-8 rounded-[28px] bg-surface p-5 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]">
      <h2 className="font-display text-2xl">Hero films</h2>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Each niche plays the film matched from the hero folder. Contractors, plumbing, auto repair, and barbers keep their named films. A shop pins a different file from its brand panel. These lines are saved in this browser and drawn on every hero opened here.
      </p>
      <ul className="mt-4 grid max-h-80 gap-2 overflow-auto sm:grid-cols-2">
        {films.map((film) => (
          <li key={film.niche} className="grid gap-2 rounded-xl bg-bg px-3 py-2 text-sm">
            <span className="capitalize">{film.niche}</span>
            <select
              aria-label={`${film.niche} film`}
              value={overrides[film.niche] || "default"}
              onChange={(event) => {
                writeNicheFilmOverride(film.niche, event.target.value);
                setOverrides(readNicheOverrides());
              }}
              className="h-10 rounded-lg bg-surface px-2 text-sm text-fg"
            >
              <option value="default">Matched · {film.file}</option>
              {catalogChoices(film.niche).map((choice) => (
                <option key={choice.url} value={choice.url}>
                  {choice.label}
                </option>
              ))}
            </select>
          </li>
        ))}
      </ul>
      <div className="mt-4 grid gap-3">
        {lines.map((line, index) => (
          <input
            key={index}
            value={line}
            maxLength={80}
            aria-label={`Telemetry line ${index + 1}`}
            placeholder={index === 0 ? "Telemetry line" : "Another line"}
            onChange={(event) => {
              const next = lines.slice();
              next[index] = event.target.value;
              setLines(next);
              setSaved(false);
            }}
            className="h-11 rounded-xl bg-bg px-3 text-sm text-fg shadow-[0_0_0_1px_rgba(243,241,235,0.08)]"
          />
        ))}
        <button
          type="button"
          className="h-11 justify-self-start rounded-xl bg-fg px-4 text-sm font-medium text-bg"
          onClick={() => {
            writeMasterTelemetry(lines);
            setSaved(true);
          }}
        >
          {saved ? "Telemetry saved" : "Save telemetry"}
        </button>
      </div>
    </section>
  );
}

export function MasterAdminPage() {
  const { user, isPending } = useCurrentUserState();
  const search = useSearch({ strict: false }) as { key?: string };
  const navigate = useNavigate();
  const stay = stayOnDesk(useRouterState({ select: (state) => state.location.pathname }));
  const [entry, setEntry] = useState<"loading" | "bypass" | "signed-out">("loading");
  const [configured, setConfigured] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [desk, setDesk] = useState<Desk | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const key = typeof search.key === "string" ? search.key : "";

  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      if (key) {
        try {
          await claimMasterBypass({ data: { key } });
          if (cancelled) return;
          setConfigured(true);
          setEntry("bypass");
          setKeyError(null);
          void navigate({ to: stay, search: {}, replace: true });
          return;
        } catch (err: unknown) {
          if (!cancelled) setKeyError(err instanceof Error ? err.message : "That key does not open the desk.");
        }
      }
      try {
        const next = await masterEntry();
        if (cancelled) return;
        setConfigured(next.configured);
        setEntry(next.access);
      } catch {
        if (!cancelled) setEntry("signed-out");
      }
    };
    void boot();
    return () => {
      cancelled = true;
    };
  }, [key, navigate, stay]);

  const bypass = entry === "bypass";
  const userId = bypass ? "bypass" : user?.id;
  useEffect(() => {
    if (entry === "loading" || isPending || !userId) return;
    let cancelled = false;
    const load = () => {
      void getMasterDesk()
        .then((next) => {
          if (!cancelled) {
            setError(null);
            setDesk(next);
          }
        })
        .catch((err: unknown) => {
          if (!cancelled) setError(err instanceof Error ? err.message : "Forbidden");
        });
    };
    load();
    const id = window.setInterval(load, 8000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [entry, isPending, userId]);

  if (entry === "loading" || isPending || ((bypass || user) && !desk && !error)) {
    return (
      <main className="grid min-h-dvh place-items-center bg-bg">
        <div className="h-10 w-48 animate-pulse rounded-full bg-fg/8" />
      </main>
    );
  }
  if (!bypass && !user) {
    if (configured) {
      return (
        <BypassGate
          message={keyError}
          onUnlock={() => {
            setKeyError(null);
            setError(null);
            setEntry("bypass");
            void navigate({ to: stay, search: {}, replace: true });
          }}
        />
      );
    }
    return <Navigate to="/login" search={{ next: "/master" }} />;
  }
  if (error || !desk) {
    return (
      <Locked
        message={error ?? "Forbidden"}
        extra={
          configured && !bypass ? (
            <BypassGate
              embedded
              message={keyError}
              onUnlock={() => {
                setKeyError(null);
                setError(null);
                setDesk(null);
                setEntry("bypass");
                void navigate({ to: stay, search: {}, replace: true });
              }}
            />
          ) : null
        }
      />
    );
  }
  return (
    <DeskView
      desk={desk}
      persistent={bypass}
      query={query}
      onQuery={setQuery}
      onRefresh={() => {
        void getMasterDesk().then(setDesk).catch(() => undefined);
      }}
    />
  );
}

function Locked({ message, extra }: { message: string; extra?: ReactNode }) {
  const unconfigured = message === "Master admin is not configured";
  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-6 py-16 text-center">
      <div className="w-full max-w-md">
        <Wordmark />
        <h1 className="mt-8 font-display text-4xl">This desk is locked.</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {unconfigured
            ? "Set MASTER_ADMIN_EMAIL to the platform owner's sign-in email, then restart the app."
            : "Only the platform owner account can open the master desk."}
        </p>
        {extra}
        <Link to="/" className="mt-6 inline-block text-sm text-muted underline-offset-4 hover:underline">
          Back to Axiom
        </Link>
      </div>
    </main>
  );
}

function BypassGate({
  message,
  onUnlock,
  embedded = false,
}: {
  message: string | null;
  onUnlock: () => void;
  embedded?: boolean;
}) {
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const shown = localError ?? message;
  const form = (
    <form
      className={embedded ? "mt-8 text-left" : "mt-8 text-left"}
      onSubmit={(event) => {
        event.preventDefault();
        setBusy(true);
        setLocalError(null);
        void claimMasterBypass({ data: { key: key.trim() } })
          .then(() => onUnlock())
          .catch((err: unknown) => {
            setLocalError(err instanceof Error ? err.message : "That key does not open the desk.");
          })
          .finally(() => setBusy(false));
      }}
    >
      <Label htmlFor="master-owner-key">Owner key</Label>
      <Input
        id="master-owner-key"
        type="password"
        name="master-owner-key"
        autoComplete="current-password"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="go"
        value={key}
        onChange={(event) => setKey(event.target.value)}
      />
      {shown ? <p className="mt-3 text-sm text-danger">{shown}</p> : null}
      <Button type="submit" className="mt-4 w-full" disabled={busy || key.trim().length < 16}>
        {busy ? "Checking the key" : "Open the desk"}
      </Button>
    </form>
  );
  if (embedded) return form;
  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-6 py-16">
      <div className="w-full max-w-md">
        <Wordmark />
        <p className="mt-8 text-xs uppercase tracking-[0.22em] text-muted">Master desk</p>
        <h1 className="mt-2 font-display text-4xl leading-none">Open the owner desk.</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Enter the owner key once. This browser keeps the desk open for a year, and each visit renews that session.
        </p>
        {form}
        <div className="mt-8 rounded-[24px] bg-surface px-4 py-4 text-sm leading-relaxed text-muted shadow-[0_0_0_1px_rgba(243,241,235,0.08)]">
          <p className="text-xs uppercase tracking-[0.18em] text-fg">Pin it to your phone</p>
          <p className="mt-2">
            Open <span className="text-fg">/master</span> in Safari or Chrome, then Add to Home Screen. The icon opens
            this desk. <span className="text-fg">/admin</span> opens it too.
          </p>
        </div>
      </div>
    </main>
  );
}

function DeskView({
  desk,
  persistent,
  query,
  onQuery,
  onRefresh,
}: {
  desk: Desk;
  persistent: boolean;
  query: string;
  onQuery: (value: string) => void;
  onRefresh: () => void;
}) {
  const [regionQuery, setRegionQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const regionNeedle = regionQuery.trim().toLowerCase();
  const regions = useMemo(() => {
    if (!regionNeedle) return desk.attribution;
    return desk.attribution.filter((row) =>
      [row.county, row.tradeType, row.tradeLabel].join(" ").toLowerCase().includes(regionNeedle),
    );
  }, [desk.attribution, regionNeedle]);
  const shops = useMemo(() => {
    if (!needle) return desk.shops;
    return desk.shops.filter((shop) =>
      [shop.name, shop.slug, shop.niche, shop.status, shop.ownerEmail].join(" ").toLowerCase().includes(needle),
    );
  }, [desk.shops, needle]);

  return (
    <main className="min-h-dvh bg-bg px-5 py-6 sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Wordmark />
          <p className="mt-3 text-xs uppercase tracking-[0.22em] text-muted">Master desk</p>
          <h1 className="mt-2 font-display text-4xl leading-none sm:text-5xl">Every shop, one wire.</h1>
          {persistent ? (
            <p className="mt-3 max-w-md text-sm text-muted">
              Owner session on this device. It stays signed in across refreshes. Add <span className="text-fg">/master</span> to
              your home screen and the icon opens this desk.
            </p>
          ) : null}
        </div>
        <p className="flex items-center gap-2 text-sm text-muted">
          <Radio className="size-4 text-accent" aria-hidden />
          Refreshes while this page is open
        </p>
      </header>

      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        <Kpi label="Active shops" value={desk.kpis.activeShops.toLocaleString()} />
        <Kpi label="Bookings processed" value={desk.kpis.bookings.toLocaleString()} />
        <Kpi label="Revenue captured" value={formatMoney(desk.kpis.revenueCents)} />
      </section>

      <PlatformWire />

      <CommandStrip desk={desk} />

      <section className="mt-8">
        <h2 className="font-display text-2xl">Activations</h2>
        <p className="mt-2 max-w-xl text-sm text-muted">
          A finished checkout leaves simulation and is logged here as live.
        </p>
        <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl bg-surface shadow-[0_0_0_1px_rgba(243,241,235,0.08)]">
          {desk.activations.length === 0 ? (
            <li className="px-4 py-6 text-sm text-muted">No territory has gone live yet.</li>
          ) : (
            desk.activations.map((activation) => (
              <li key={activation.id} className="flex flex-wrap items-baseline justify-between gap-3 px-4 py-3 text-sm">
                <span>
                  {activation.businessName}
                  <span className="text-muted"> · {activation.planName}</span>
                </span>
                <span className="text-muted">
                  Live · {activation.amountCents === 0 ? "$0 today" : formatMoney(activation.amountCents)} ·{" "}
                  {when(activation.createdAt)}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.8fr)]">
        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-2xl">Tenants</h2>
            <Input
              value={query}
              onChange={(event) => onQuery(event.target.value)}
              placeholder="Search name, trade, status"
              aria-label="Search shops"
              className="w-full sm:max-w-xs"
            />
          </div>
          <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl bg-surface shadow-[0_0_0_1px_rgba(243,241,235,0.08)]">
            {shops.length === 0 ? (
              <li className="px-4 py-6 text-sm text-muted">No shops match.</li>
            ) : (
              shops.map((shop) => (
                <li key={shop.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{shop.name}</p>
                    <p className="truncate text-sm text-muted">
                      {shop.niche} · {shop.status}
                      {shop.ownerEmail ? ` · ${shop.ownerEmail}` : ""}
                    </p>
                  </div>
                  {shop.showcase ? (
                    <Link
                      to="/$shopSlug/admin"
                      params={{ shopSlug: shop.slug }}
                      className="inline-flex h-11 items-center gap-1 rounded-xl px-3 text-sm text-muted hover:text-fg"
                    >
                      Preview <ArrowUpRight className="size-4" aria-hidden />
                    </Link>
                  ) : (
                    <Link
                      to="/$shopSlug/admin"
                      params={{ shopSlug: shop.slug }}
                      search={{ desk: "master" }}
                      onClick={() => {
                        void recordMasterDeskOpen({ data: shop.slug }).catch(() => undefined);
                      }}
                      className="inline-flex h-11 items-center gap-1 rounded-xl bg-fg px-3 text-sm font-medium text-bg"
                    >
                      Open desk <ArrowUpRight className="size-4" aria-hidden />
                    </Link>
                  )}
                </li>
              ))
            )}
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl">Live wire</h2>
          <ul className="mt-4 max-h-[28rem] space-y-2 overflow-auto">
            {desk.events.length === 0 ? (
              <li className="text-sm text-muted">No shop events yet.</li>
            ) : (
              desk.events.map((event) => (
                <li key={event.id} className="rounded-xl bg-surface px-3 py-3 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]">
                  <p className="text-sm">{event.shopName}</p>
                  <p className="text-sm text-muted">
                    {event.type.split("_").join(" ")} · {when(event.createdAt)}
                  </p>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      <AutopilotCard mode={desk.outreach.mode} onDispatched={onRefresh} />
      <HeroFilmPanel />

      <OutreachEngine
        onLaunched={onRefresh}
        mode={desk.outreach.mode}
        intervalSeconds={desk.outreach.intervalSeconds}
        chunkSize={desk.outreach.chunkSize}
        trades={desk.attribution}
      />

      <BulkIngest />

      <StrategicFunnel />

      <FunnelTool />

      <section className="mt-10">
        <h2 className="font-display text-2xl">Attribution</h2>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Visits record the lead slug, county, and utm source. A shop created from that link marks the business claimed.
        </p>
        <Input
          value={regionQuery}
          onChange={(event) => setRegionQuery(event.target.value)}
          placeholder="Search county or trade"
          aria-label="Search regions"
          className="mt-4 max-w-sm"
        />
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <ul className="divide-y divide-line rounded-2xl bg-surface shadow-[0_0_0_1px_rgba(243,241,235,0.08)]">
            {regions.length === 0 ? (
              <li className="px-4 py-6 text-sm text-muted">No regional lists yet.</li>
            ) : (
              regions.map((row) => (
                <li key={`${row.county}-${row.tradeType}`} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span>
                    {row.county} · {row.tradeLabel || NICHES[row.tradeType as ShopNiche]?.label || row.tradeType}
                  </span>
                  <span className="text-muted">
                    {row.hits} visits · {row.claimed}/{row.leads} claimed
                  </span>
                </li>
              ))
            )}
          </ul>
          <ul className="space-y-2">
            {desk.hits.length === 0 ? (
              <li className="text-sm text-muted">No visits yet.</li>
            ) : (
              desk.hits.map((hit) => (
                <li key={hit.id} className="rounded-xl bg-surface px-3 py-3 text-sm shadow-[0_0_0_1px_rgba(243,241,235,0.08)]">
                  <p>{hit.leadSlug || "unscoped visit"}</p>
                  <p className="text-muted">
                    {hit.county || "no county"} · {hit.utmSource || "no source"}
                    {hit.becameShop ? " · became a shop" : ""} · {when(hit.createdAt)}
                  </p>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>
    </main>
  );
}

type OutreachPreview = Awaited<ReturnType<typeof previewOutreach>>;

function contactLine(lead: { contactEmail: string; contactPhone: string }): string {
  const parts = [lead.contactPhone, lead.contactEmail].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "No contact on file";
}

function TradeSelect({
  value,
  onChange,
  allowAll = false,
  extra = [],
}: {
  value: string;
  onChange: (value: string) => void;
  allowAll?: boolean;
  extra?: { value: string; label: string }[];
}) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const options = [
    ...NICHE_ORDER.map((niche) => ({ value: niche, label: NICHES[niche].label })),
    ...extra.filter((item) => !isShopNiche(item.value)),
  ].filter((item) => !needle || item.label.toLowerCase().includes(needle) || item.value.includes(needle));
  const selected = value === "all" || options.some((item) => item.value === value) ? value : allowAll ? "all" : value;
  return (
    <div className="grid gap-2">
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search trades"
        aria-label="Search trades"
      />
      <select
        value={selected}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl bg-surface px-3 text-sm text-fg shadow-[0_0_0_1px_rgba(243,241,235,0.08)]"
        aria-label="Trade"
      >
        {allowAll ? <option value="all">All trades</option> : null}
        {options.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
        {selected !== "all" && !options.some((item) => item.value === selected) ? (
          <option value={selected}>{nicheLabel(selected)}</option>
        ) : null}
      </select>
    </div>
  );
}

const draftClass =
  "w-full rounded-xl bg-surface px-3 py-3 text-sm text-fg shadow-[0_0_0_1px_rgba(243,241,235,0.08)] outline-none focus:shadow-[0_0_0_2px_var(--color-accent)]";

const selectClass =
  "h-11 w-full rounded-xl bg-surface px-3 text-sm text-fg shadow-[0_0_0_1px_rgba(243,241,235,0.08)]";

function OutreachEngine({
  onLaunched,
  mode,
  intervalSeconds,
  chunkSize,
  trades,
}: {
  onLaunched: () => void;
  mode: "simulation" | "live";
  intervalSeconds: number;
  chunkSize: number;
  trades: { county: string; tradeType: string; tradeLabel: string }[];
}) {
  const opening = outreachStrategy("done-for-you");
  const [county, setCounty] = useState("");
  const [trade, setTrade] = useState("location");
  const [leadQuery, setLeadQuery] = useState("");
  const [sort, setSort] = useState<LeadSort>("name");
  const [strategy, setStrategy] = useState<OutreachStrategyId>(opening.id);
  const [text, setText] = useState<string>(opening.text);
  const [emailSubject, setEmailSubject] = useState<string>(opening.emailSubject);
  const [emailBody, setEmailBody] = useState<string>(opening.emailBody);
  const [preview, setPreview] = useState<OutreachPreview | null>(null);
  const [selected, setSelected] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState<"load" | "email" | "sms" | "preload" | null>(null);
  const [smartTiming, setSmartTiming] = useState(false);

  const leads = preview?.leads ?? [];
  const countyKey = county.trim().toLowerCase();
  const tradeOptions = trades
    .filter((item) => !countyKey || item.county.toLowerCase() === countyKey)
    .map((item) => ({ value: item.tradeType, label: item.tradeLabel || nicheLabel(item.tradeType) }));
  const visibleLeads = sortLeads(
    leads.filter((lead) => {
      const needle = leadQuery.trim().toLowerCase();
      if (!needle) return true;
      return [lead.businessName, lead.city, lead.tradeLabel, lead.county].join(" ").toLowerCase().includes(needle);
    }),
    sort,
  );
  const active = leads.find((lead) => lead.leadSlug === selected) ?? leads.find((lead) => !lead.claimed) ?? leads[0];
  const unclaimed = leads.filter((lead) => !lead.claimed);
  const smsReady = unclaimed.filter((lead) => isSmsReady(lead.phoneLine)).length;
  const emailReady = unclaimed.filter((lead) => isEmailReady(lead.contactEmail)).length;
  const activeLoops = leads.reduce(
    (count, lead) => count + (lead.followUps ?? []).filter((loop) => loop.status === "active").length,
    0,
  );
  const phrases = active
    ? outreachPublicTokens(active, active.businessName)
    : { owner: "{owner}", reviews: "{reviews}", website: "{website}", line: "{line}" };
  const tokens = {
    business: active?.businessName ?? "{business}",
    url: active?.url ?? "{url}",
    city: active?.city ?? "{city}",
    county: active?.county || county || "{county}",
    trade:
      trade === "all"
        ? active?.tradeLabel || "{trade}"
        : tradeOptions.find((item) => item.value === trade)?.label || nicheLabel(trade),
    ...phrases,
  };
  const timingMode: SendTiming = smartTiming ? "smart" : "immediate";
  const timingProfile = trade === "all" ? "mixed" : timingProfileFor(trade);
  const windowProfile = timingProfile === "mixed" ? "general" : timingProfile;
  const nextWindow = nextSendInstant(new Date(), timingMode, windowProfile);
  const windowOpen = nextWindow.getTime() <= Date.now() + 30_000;
  const renderedText = renderOutreachMessage(text, tokens);
  const renderedEmail = `${renderOutreachMessage(emailSubject, tokens)}\n\n${renderOutreachMessage(emailBody, tokens)}`;

  function applyStrategy(id: OutreachStrategyId) {
    const next = outreachStrategy(id);
    setStrategy(next.id);
    setText(next.text);
    setEmailSubject(next.emailSubject);
    setEmailBody(next.emailBody);
  }

  async function preload() {
    setBusy("preload");
    setNote(null);
    try {
      const result = await preloadRegionalRoster();
      setCounty(result.county);
      setTrade("all");
      const next = await previewOutreach({ data: { county: result.county, tradeType: "all" } });
      setPreview(next);
      setSelected(next.leads.find((lead) => !lead.claimed)?.leadSlug ?? next.leads[0]?.leadSlug ?? "");
      setNote(
        `Preloaded ${result.inserted} new businesses across ${result.counties.join(", ")}. ${result.skipped} were already on file. ${result.total} leads, ${result.niches} trades. Showing ${result.county}.`,
      );
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Could not preload the region");
    } finally {
      setBusy(null);
    }
  }

  async function load() {
    setBusy("load");
    setNote(null);
    try {
      const next = await previewOutreach({ data: { county, tradeType: trade } });
      setPreview(next);
      setSelected(next.leads.find((lead) => !lead.claimed)?.leadSlug ?? next.leads[0]?.leadSlug ?? "");
      if (next.leads.length === 0) setNote("No businesses saved for that county and trade.");
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Could not load leads");
    } finally {
      setBusy(null);
    }
  }

  async function launch(channel: "email" | "sms") {
    setBusy(channel);
    setNote(null);
    try {
      const result = await launchOutreachBatch({
        data: {
          county,
          tradeType: trade,
          strategy,
          text,
          emailSubject,
          emailBody,
          channel,
          timing: smartTiming ? "smart" : "immediate",
        },
      });
      const next = await previewOutreach({ data: { county, tradeType: trade } });
      setPreview(next);
      const hook = outreachStrategy(result.strategy).label;
      const kind = result.channel === "sms" ? "SMS-ready" : "email-ready";
      const skipped = result.skippedClicked > 0 ? ` ${result.skippedClicked} already opened their link and were left out.` : "";
      const looping = result.alreadyLooping > 0 ? ` ${result.alreadyLooping} already had an active loop.` : "";
      const loops = result.enrolled === 1 ? "1 nurture loop" : `${result.enrolled} nurture loops`;
      const chunks = result.chunks === 1 ? "1 chunk" : `${result.chunks} chunks`;
      const safety =
        result.mode === "live"
          ? "Live mode. Twilio and Resend were present, and each chunk sends on its own timer."
          : "Simulation mode. Each chunk is written to the live wire. No email or SMS is sent.";
      const heldUntil = result.firstAt ? new Date(result.firstAt) : null;
      const held = heldUntil != null && heldUntil.getTime() > Date.now() + 5_000;
      const first =
        result.released > 0
          ? "The first chunk is on the wire."
          : held && heldUntil
            ? `Dispatch stays queued until ${formatSendSlot(heldUntil)}.`
            : "The first chunk waits for the current trickle gap.";
      const hours =
        result.timing === "smart"
          ? "Smart timing holds each trade for its own hours."
          : "Weekday hours hold the queue until Monday–Thursday, 8:00 AM–7:00 PM Pacific.";
      setNote(
        `Queued ${result.leadCount} ${kind} in ${result.county} with ${hook}. ${loops} scheduled through Day 6. ${chunks}, ${result.intervalSeconds} seconds apart. ${safety} ${hours} ${first}${skipped}${looping}`,
      );
      onLaunched();
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Could not log the batch");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="mt-10">
      <p className="text-xs uppercase tracking-[0.22em] text-muted">Outreach</p>
      <h2 className="mt-2 font-display text-3xl leading-none">Autonomous outreach campaign engine</h2>
      <p className="mt-3 max-w-xl text-sm text-muted">
        Pick a county, a trade, and a hook. Each lead's owner, reviews, website, and phone line fill the text and the email.
      </p>
      <p className="mt-2 max-w-xl text-sm text-muted">
        {mode === "live"
          ? `Live mode. Chunks of ${chunkSize} leave ${intervalSeconds} seconds apart, and only after Twilio and Resend are configured.`
          : `Simulation mode. Chunks of ${chunkSize} are logged ${intervalSeconds} seconds apart. Providers are not called.`}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label="County or region">
          <Input
            value={county}
            onChange={(event) => setCounty(event.target.value)}
            placeholder="Jackson County"
            list="home-region-counties"
          />
          <datalist id="home-region-counties">
            {HOME_REGION_COUNTIES.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </Field>
        <Field label="Trade">
          <TradeSelect value={trade} onChange={setTrade} allowAll extra={tradeOptions} />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" disabled={busy !== null} onClick={() => void load()}>
            {busy === "load" ? "Loading" : "Load leads"}
          </Button>
          <Button type="button" variant="secondary" disabled={busy !== null} onClick={() => void preload()}>
            {busy === "preload" ? "Preloading" : `Preload ${HOME_REGION_LABEL}`}
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_12rem]">
        <Input
          value={leadQuery}
          onChange={(event) => setLeadQuery(event.target.value)}
          placeholder="Search name, city, or trade"
          aria-label="Search leads"
        />
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value as LeadSort)}
          className={selectClass}
          aria-label="Sort leads"
        >
          <option value="name">Sort by name</option>
          <option value="city">Sort by city</option>
          <option value="trade">Sort by trade</option>
        </select>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl bg-surface shadow-[0_0_0_1px_rgba(243,241,235,0.08)]">
        <div className="hidden grid-cols-[minmax(0,1.1fr)_minmax(0,0.7fr)_minmax(0,1.4fr)_minmax(0,0.9fr)] gap-3 px-4 py-3 text-xs uppercase tracking-[0.16em] text-muted md:grid">
          <span>Business</span>
          <span>City</span>
          <span>Funnel</span>
          <span>Contact</span>
        </div>
        {leads.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted">Load a county and trade to see the businesses on file.</p>
        ) : (
          <ul className="divide-y divide-line">
            {visibleLeads.map((lead) => {
              const on = lead.leadSlug === active?.leadSlug;
              return (
                <li key={lead.leadSlug} className="px-4 py-3" style={on ? { boxShadow: "inset 2px 0 0 var(--color-accent)" } : undefined}>
                  <button
                    type="button"
                    onClick={() => setSelected(lead.leadSlug)}
                    className="grid w-full gap-1 text-left md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.7fr)_minmax(0,1.4fr)_minmax(0,0.9fr)] md:gap-3"
                  >
                    <span className="text-sm font-medium">
                      {lead.businessName}
                      <span className="ml-2 text-muted">{lead.tradeLabel}</span>
                      {lead.claimed ? <span className="ml-2 text-muted">Claimed</span> : null}
                    </span>
                    <span className="text-sm text-muted">{lead.city}</span>
                    <span className="break-all text-sm text-muted">{lead.url}</span>
                    <span className="break-all text-sm text-muted">{contactLine(lead)}</span>
                    <span className="flex flex-wrap gap-1 md:col-span-4">
                      {leadChannelTags(lead).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full px-2 py-0.5 text-xs text-fg shadow-[0_0_0_1px_var(--color-accent)]"
                        >
                          {tag}
                        </span>
                      ))}
                      {leadPublicTags(lead).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full px-2 py-0.5 text-xs text-muted shadow-[0_0_0_1px_rgba(243,241,235,0.12)]"
                        >
                          {tag}
                        </span>
                      ))}
                    </span>
                    {(lead.followUps ?? []).length > 0 ? (
                      <span className="grid gap-2 md:col-span-4">
                        {(lead.followUps ?? []).map((loop) => (
                          <span key={loop.id} className="grid gap-1 rounded-xl bg-bg px-3 py-2">
                            <span className="text-xs uppercase tracking-[0.16em] text-muted">{loopTitle(loop)}</span>
                            {loop.status === "stopped" ? (
                              <span className="text-sm text-muted">Opened the booking link. Later touches are off.</span>
                            ) : null}
                            {loop.touches.map((touch) => (
                              <span key={touch.day} className="flex items-baseline justify-between gap-3 text-sm">
                                <span>{touch.label}</span>
                                <span className="shrink-0 text-muted">{touchWhen(touch)}</span>
                              </span>
                            ))}
                          </span>
                        ))}
                      </span>
                    ) : null}
                  </button>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <a
                      href={pitchHref(lead)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-12 w-full items-center justify-center rounded-[14px] bg-accent px-5 text-[15px] font-medium text-bg sm:w-auto"
                    >
                      🎩 In-Person Magic Trick
                    </a>
                    <span className="text-xs uppercase tracking-[0.16em] text-muted">
                      {lead.accountMode === "live" ? "Live" : "Simulation"}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {OUTREACH_STRATEGIES.map((item) => {
          const on = item.id === strategy;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={on}
              onClick={() => applyStrategy(item.id)}
              className="rounded-2xl bg-surface px-4 py-3 text-left"
              style={{
                boxShadow: on ? "inset 0 0 0 2px var(--color-accent)" : "0 0 0 1px rgba(243,241,235,0.08)",
              }}
            >
              <p className="text-sm font-medium">{item.label}</p>
              <p className="mt-1 text-sm text-muted">{item.line}</p>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-faint">
        {"Use {business}, {owner}, {city}, {county}, {trade}, {reviews}, {website}, {line}, and {url}."}
      </p>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div className="grid gap-3">
          <Field label="Text">
            <textarea value={text} onChange={(event) => setText(event.target.value)} rows={4} className={draftClass} />
          </Field>
          <DraftPreview label={active ? `Text · ${active.businessName}` : "Text preview"} body={renderedText} />
        </div>
        <div className="grid content-start gap-3">
          <Field label="Email subject">
            <Input value={emailSubject} onChange={(event) => setEmailSubject(event.target.value)} />
          </Field>
          <Field label="Email">
            <textarea
              value={emailBody}
              onChange={(event) => setEmailBody(event.target.value)}
              rows={6}
              className={draftClass}
            />
          </Field>
          <DraftPreview label={active ? `Email · ${active.businessName}` : "Email preview"} body={renderedEmail} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl bg-surface px-4 py-4 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">SMS-ready</p>
          <p className="mt-2 font-display text-4xl leading-none">{preview ? smsReady : "—"}</p>
          <p className="mt-2 text-sm text-muted">Unclaimed mobile lines</p>
        </article>
        <article className="rounded-2xl bg-surface px-4 py-4 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Email-ready</p>
          <p className="mt-2 font-display text-4xl leading-none">{preview ? emailReady : "—"}</p>
          <p className="mt-2 text-sm text-muted">Unclaimed addresses that parse</p>
        </article>
        <article className="rounded-2xl bg-surface px-4 py-4 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Active loops</p>
          <p className="mt-2 font-display text-4xl leading-none">{preview ? activeLoops : "—"}</p>
          <p className="mt-2 text-sm text-muted">Day 0 leaves with its chunk</p>
        </article>
      </div>
      <button
        type="button"
        aria-pressed={smartTiming}
        onClick={() => setSmartTiming((on) => !on)}
        className="mt-4 w-full rounded-2xl bg-surface px-4 py-4 text-left"
        style={{
          boxShadow: smartTiming ? "inset 0 0 0 2px var(--color-accent)" : "0 0 0 1px rgba(243,241,235,0.08)",
        }}
      >
        <p className="text-xs uppercase tracking-[0.16em] text-muted">Smart Timing Mode</p>
        <p className="mt-2 text-sm font-medium">{smartTiming ? "On" : "Off"}</p>
        <p className="mt-1 text-sm text-muted">{sendWindowBlurb(timingMode, timingProfile)}</p>
        <p className="mt-2 text-sm text-fg">
          {smartTiming && trade === "all"
            ? "A mixed list holds each business for its own window."
            : windowOpen
              ? "The window is open. Chunks can leave on the trickle timer."
              : `Next window opens ${formatSendSlot(nextWindow)}.`}
        </p>
      </button>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="button" disabled={busy !== null || emailReady === 0} onClick={() => void launch("email")}>
          <Mail className="size-4" aria-hidden />
          {busy === "email" ? "Queuing" : "Launch Email Batch"}
        </Button>
        <Button type="button" variant="secondary" disabled={busy !== null || smsReady === 0} onClick={() => void launch("sms")}>
          <Smartphone className="size-4" aria-hidden />
          {busy === "sms" ? "Queuing" : "Launch SMS Batch"}
        </Button>
      </div>
      <p className="mt-3 text-sm text-muted">
        {preview == null
          ? "Load a county to sort the list into channels."
          : "A mobile line is SMS-ready. A real address is email-ready. A launch queues chunks instead of sending the list at once. Day 3 and Day 6 wait for the same hours as the batch. Only the private link in the message stops that lead. Simulation only writes the live wire."}
      </p>
      {note ? <p className="mt-3 text-sm text-muted">{note}</p> : null}
    </section>
  );
}

function loopTitle(loop: { channel: "email" | "sms"; status: string; strategy: string }) {
  const channel = loop.channel === "sms" ? "SMS" : "Email";
  const status = loop.status === "stopped" ? "Stopped" : loop.status === "complete" ? "Complete" : "Active";
  const hook = loop.strategy ? outreachStrategy(loop.strategy).label : "";
  return `${channel} nurture · ${status}${hook ? ` · ${hook}` : ""}`;
}

function touchWhen(touch: { status: string; scheduledAt: string }) {
  if (touch.status === "sent") return "Sent";
  if (touch.status === "skipped") return "Skipped";
  const date = new Date(touch.scheduledAt);
  if (Number.isNaN(date.getTime())) return "Scheduled";
  return `Scheduled ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

function DraftPreview({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium tracking-wide text-muted">{label}</p>
      <pre className="min-h-28 whitespace-pre-wrap rounded-xl bg-surface px-3 py-3 font-sans text-sm text-fg shadow-[0_0_0_1px_rgba(243,241,235,0.08)]">
        {body}
      </pre>
    </div>
  );
}

function emptyImport(): BulkImportResult {
  return { leads: [], invalid: [], invalidCount: 0, merged: 0, inserted: 0, updated: 0, unchanged: 0 };
}

function foldImport(into: BulkImportResult, next: BulkImportResult) {
  into.inserted += next.inserted;
  into.updated += next.updated;
  into.unchanged += next.unchanged;
  into.merged += next.merged;
  into.invalidCount += next.invalidCount ?? next.invalid.length;
  for (const row of next.invalid) {
    if (into.invalid.length < 40) into.invalid.push(row);
  }
}

function snapshotImport(totals: BulkImportResult): BulkImportResult {
  return { ...totals, leads: [], invalid: [...totals.invalid] };
}

async function sendImportBatch(
  chunk: { name?: string; city?: string; county?: string; trade?: string; email?: string; phone?: string; website?: string; phoneLine?: string; line?: number }[],
  totals: BulkImportResult,
  batch: number,
  setProgress: (value: string) => void,
  setResult: (value: BulkImportResult) => void,
) {
  setProgress(`Staging batch ${batch.toLocaleString()} · ${IMPORT_BATCH.toLocaleString()} rows at a time`);
  foldImport(totals, await importBulkLeads({ data: { leads: chunk } }));
  setResult(snapshotImport(totals));
}

async function importText(
  body: string,
  totals: BulkImportResult,
  setProgress: (value: string) => void,
  setResult: (value: BulkImportResult) => void,
) {
  let batch = 0;
  for (const chunk of leadCsvChunks(body)) {
    batch += 1;
    await sendImportBatch(chunk, totals, batch, setProgress, setResult);
  }
}

async function importFile(
  file: File,
  totals: BulkImportResult,
  setProgress: (value: string) => void,
  setResult: (value: BulkImportResult) => void,
) {
  const reader = file.stream().getReader();
  const decoder = new TextDecoder();
  const parser = createLeadCsvReader();
  let batch = 0;
  for (;;) {
    const { value, done } = await reader.read();
    const piece = decoder.decode(value ?? new Uint8Array(), { stream: !done });
    for (const chunk of parser.push(piece)) {
      batch += 1;
      await sendImportBatch(chunk, totals, batch, setProgress, setResult);
    }
    if (done) break;
  }
  const tail = parser.finish();
  if (tail.length > 0) {
    batch += 1;
    await sendImportBatch(tail, totals, batch, setProgress, setResult);
  }
}

function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function BulkIngest() {
  const [csv, setCsv] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileBytes, setFileBytes] = useState(0);
  const [busy, setBusy] = useState<"import" | "sweep" | null>(null);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const fileRef = useRef<File | null>(null);

  async function loadFile(file: File | undefined) {
    if (!file) return;
    const name = file.name.toLowerCase();
    const textType = file.type === "" || file.type.startsWith("text/") || file.type.includes("csv");
    if (!name.endsWith(".csv") && !textType) {
      setError("Choose a .csv file");
      return;
    }
    setError(null);
    setResult(null);
    setFileName(file.name);
    if (file.size > 400_000) {
      fileRef.current = file;
      setFileBytes(file.size);
      setCsv("");
      return;
    }
    fileRef.current = null;
    setFileBytes(0);
    setCsv(await file.text());
  }

  async function run() {
    const file = fileRef.current;
    const body = csv.trim();
    if (!file && !body) {
      setError("Paste a CSV or choose a file");
      return;
    }
    setBusy("import");
    setError(null);
    setProgress("");
    const totals = emptyImport();
    try {
      if (file) await importFile(file, totals, setProgress, setResult);
      else await importText(body, totals, setProgress, setResult);
      if (totals.inserted + totals.updated + totals.unchanged + totals.invalidCount + totals.merged === 0) {
        setError("That file had no rows");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusy(null);
      setProgress("");
    }
  }

  async function sweep() {
    setBusy("sweep");
    setError(null);
    setProgress("");
    const totals = emptyImport();
    try {
      let offset = 0;
      for (;;) {
        const next = await importRegistrySweep({ data: { offset } });
        foldImport(totals, next);
        setResult(snapshotImport(totals));
        setProgress(`${next.county} · ${next.nextOffset.toLocaleString()} of ${next.total.toLocaleString()}`);
        const previous = offset;
        offset = next.nextOffset;
        if (next.done || offset <= previous) break;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sweep failed");
    } finally {
      setBusy(null);
      setProgress("");
    }
  }

  const invalid = result?.invalid ?? [];
  const invalidCount = result?.invalidCount ?? invalid.length;
  const shown = invalid.slice(0, 40);

  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl">Bulk lead ingestion</h2>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Upload a .csv or paste the sheet. Columns: Business, City, County, Niche, Email, Phone, Website. A county file is staged in batches of {IMPORT_BATCH.toLocaleString()}, then moved into the live list. Filing titles such as Electrical, Plumbing, Firewood, Lock, Handyman, and Sole proprietor land on the matching niche. Sweep Florida registry loads {SWEEP_PER_COUNTY.toLocaleString()} filings in Miami-Dade, Broward, Palm Beach, Hillsborough, Orange, and Duval. A claimed or live business stays as it is.
      </p>
      <div className="mt-4 grid gap-4">
        <Field label="CSV file">
          <input
            type="file"
            accept=".csv,text/csv,text/plain"
            className="block w-full text-sm text-muted file:mr-3 file:h-11 file:cursor-pointer file:rounded-xl file:border-0 file:bg-surface-2 file:px-4 file:text-sm file:font-medium file:text-fg"
            onChange={(event) => {
              const file = event.target.files?.[0];
              void loadFile(file);
              event.target.value = "";
            }}
          />
          {fileName ? (
            <p className="text-sm text-muted">
              {fileBytes > 0
                ? `${fileName} (${fileSize(fileBytes)}) imports in batches of ${IMPORT_BATCH.toLocaleString()} and stays out of the box below.`
                : `${fileName} is in the box below. Edit it, then run the import.`}
            </p>
          ) : null}
        </Field>
        <Field label="Or paste CSV">
          <textarea
            value={csv}
            onChange={(event) => {
              setCsv(event.target.value);
              fileRef.current = null;
              setFileBytes(0);
              setResult(null);
            }}
            rows={10}
            spellCheck={false}
            placeholder={"Business,City,County,Niche,Email,Phone,Website"}
            className="min-h-56 w-full resize-y rounded-xl bg-surface px-3 py-3 text-base text-fg shadow-[0_0_0_1px_rgba(243,241,235,0.08)] placeholder:text-muted"
            aria-label="CSV text"
          />
        </Field>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" disabled={busy !== null || (csv.trim().length === 0 && fileBytes === 0)} onClick={() => void run()}>
            {busy === "import" ? "Importing" : "Run Bulk Import"}
          </Button>
          <Button type="button" variant="secondary" disabled={busy !== null} onClick={() => void sweep()}>
            {busy === "sweep" ? "Sweeping Florida" : "Sweep Florida registry"}
          </Button>
          {progress ? <p className="w-full text-sm text-muted">{progress}</p> : null}
        </div>
      </div>
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      {result ? (
        <div className="mt-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Inserted" value={result.inserted.toLocaleString()} />
            <Kpi label="Updated" value={result.updated.toLocaleString()} />
            <Kpi label="Unchanged" value={result.unchanged.toLocaleString()} />
            <Kpi label="Invalid" value={invalidCount.toLocaleString()} />
          </div>
          {result.merged > 0 ? (
            <p className="mt-3 text-sm text-muted">
              {result.merged.toLocaleString()} repeated {result.merged === 1 ? "business was" : "businesses were"} folded into one row.
            </p>
          ) : null}
          <div className="mt-4 rounded-2xl bg-surface px-4 py-4 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]">
            <p className="text-xs uppercase tracking-[0.18em] text-muted">Invalid rows</p>
            {invalidCount === 0 ? (
              <p className="mt-3 text-sm text-muted">Every row was usable.</p>
            ) : (
              <ul className="mt-3 max-h-64 space-y-2 overflow-auto text-sm">
                {shown.map((row) => (
                  <li key={`${row.line}-${row.reason}`}>
                    <span className="text-muted">Line {row.line}</span>
                    <span className="text-fg"> · {row.reason}</span>
                  </li>
                ))}
              </ul>
            )}
            {invalidCount > shown.length ? (
              <p className="mt-3 text-sm text-muted">
                {(invalidCount - shown.length).toLocaleString()} more invalid {invalidCount - shown.length === 1 ? "row" : "rows"} were left out of this list.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function StrategicFunnel() {
  const [businessName, setBusinessName] = useState("");
  const [niche, setNiche] = useState<string>(PUBLIC_NICHE_ORDER[0] ?? "contractor");
  const [contact, setContact] = useState("");
  const [city, setCity] = useState("");
  const [path, setPath] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listOutreachFunnels>>>([]);

  useEffect(() => {
    let stop = false;
    const load = () => {
      void listOutreachFunnels()
        .then((next) => {
          if (!stop) setRows(next);
        })
        .catch(() => undefined);
    };
    load();
    const timer = window.setInterval(load, 5000);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl">Strategic outreach</h2>
      <p className="mt-2 max-w-xl text-sm text-muted">
        One prospect, one preview. The link opens their niche with a before-and-after sample and the claim button. Nothing is emailed from here.
      </p>
      <form
        className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault();
          setBusy(true);
          setNote(null);
          setCopied(false);
          void createOutreachFunnel({ data: { businessName, niche, contact, city } })
            .then(async (result) => {
              setPath(result.path);
              setBusinessName("");
              setContact("");
              setCity("");
              const next = await listOutreachFunnels();
              setRows(next);
            })
            .catch((err: unknown) => setNote(err instanceof Error ? err.message : "Could not build the link"))
            .finally(() => setBusy(false));
        }}
      >
        <Field label="Business">
          <Input value={businessName} onChange={(event) => setBusinessName(event.target.value)} required />
        </Field>
        <Field label="Niche">
          <select
            value={niche}
            onChange={(event) => setNiche(event.target.value)}
            className="h-10 rounded-xl bg-surface px-3 text-sm text-fg shadow-[0_0_0_1px_rgba(243,241,235,0.08)]"
            aria-label="Niche"
          >
            {PUBLIC_NICHE_ORDER.map((id) => (
              <option key={id} value={id}>
                {NICHES[id].label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Email or phone">
          <Input value={contact} onChange={(event) => setContact(event.target.value)} required />
        </Field>
        <Field label="City">
          <Input value={city} onChange={(event) => setCity(event.target.value)} required />
        </Field>
        <div className="sm:col-span-2 lg:col-span-4">
          <Button type="submit" disabled={busy}>
            {busy ? "Building" : "Generate preview link"}
          </Button>
        </div>
      </form>
      {note ? <p className="mt-3 text-sm text-danger">{note}</p> : null}
      {path ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="break-all text-sm">{path}</p>
          <button
            type="button"
            className="text-sm text-muted"
            onClick={() => {
              void navigator.clipboard.writeText(window.location.origin + path).then(() => {
                setCopied(true);
              });
            }}
          >
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      ) : null}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="text-muted">
            <tr>
              <th className="py-2 pr-3 font-medium">Prospect</th>
              <th className="py-2 pr-3 font-medium">Niche</th>
              <th className="py-2 pr-3 font-medium">Contact</th>
              <th className="py-2 pr-3 font-medium">Opened</th>
              <th className="py-2 pr-3 font-medium">Tested</th>
              <th className="py-2 font-medium">Subscriber</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="py-4 text-muted" colSpan={6}>
                  No desk funnels yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.leadSlug} className="border-t border-line">
                  <td className="py-3 pr-3">
                    <a href={row.path} className="font-medium hover:underline">
                      {row.businessName}
                    </a>
                    <span className="mt-1 block text-muted">{row.city}</span>
                  </td>
                  <td className="py-3 pr-3">{row.niche}</td>
                  <td className="py-3 pr-3">{row.contact}</td>
                  <td className="py-3 pr-3">{row.opened ? "Yes" : "—"}</td>
                  <td className="py-3 pr-3">{row.tested ? "Yes" : "—"}</td>
                  <td className="py-3">{row.converted ? "Yes" : "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FunnelTool() {
  const [county, setCounty] = useState("");
  const [category, setCategory] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [city, setCity] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactName, setContactName] = useState("");
  const [reviewScore, setReviewScore] = useState("");
  const [reviewCount, setReviewCount] = useState("");
  const [hasWebsite, setHasWebsite] = useState("");
  const [phoneLine, setPhoneLine] = useState("");
  const [links, setLinks] = useState<FunnelLinks | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState<"add" | "gen" | null>(null);
  const [copied, setCopied] = useState(false);

  async function addLead() {
    setBusy("add");
    setNote(null);
    try {
      const saved = await addPreloadedLeads({
        data: {
          leads: [{
            businessName,
            tradeType: category,
            city,
            county,
            contactPhone,
            contactEmail,
            contactName,
            reviewScore,
            reviewCount,
            hasWebsite,
            phoneLine,
          }],
        },
      });
      setBusinessName("");
      setCity("");
      setContactPhone("");
      setContactEmail("");
      setContactName("");
      setReviewScore("");
      setReviewCount("");
      setHasWebsite("");
      setPhoneLine("");
      setNote(`Saved ${saved.leads[0]?.leadSlug ?? "lead"}.`);
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(null);
    }
  }

  async function generate() {
    setBusy("gen");
    setNote(null);
    setCopied(false);
    try {
      const next = await generateRegionalFunnel({ data: { county, tradeType: category } });
      setLinks(next);
      setNote(next.links.length === 0 ? "No unclaimed businesses in that county and trade." : null);
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Could not build links");
    } finally {
      setBusy(null);
    }
  }

  const blob = links?.links.map((link) => link.url).join("\n") ?? "";

  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl">Regional funnel</h2>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Save businesses, then print a link for each unclaimed one. The link is yourplatform.com/?b=their-slug, with the county attached.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="County">
          <Input value={county} onChange={(event) => setCounty(event.target.value)} placeholder="Grand County" />
        </Field>
        <Field label="Category">
          <Input
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="Dog walking, HVAC, Barber…"
            list="trade-categories"
            aria-label="Category"
          />
          <datalist id="trade-categories">
            {PUBLIC_NICHE_ORDER.map((niche) => (
              <option key={niche} value={NICHES[niche].label} />
            ))}
          </datalist>
        </Field>
        <Field label="Business">
          <Input value={businessName} onChange={(event) => setBusinessName(event.target.value)} placeholder="River Bend" />
        </Field>
        <Field label="City">
          <Input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Moab" />
        </Field>
        <Field label="Phone">
          <Input value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} placeholder="Optional" />
        </Field>
        <Field label="Email">
          <Input value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} placeholder="Optional" />
        </Field>
        <Field label="Owner">
          <Input value={contactName} onChange={(event) => setContactName(event.target.value)} placeholder="Luis Ortega" />
        </Field>
        <Field label="Review score">
          <Input value={reviewScore} onChange={(event) => setReviewScore(event.target.value)} placeholder="4.8" inputMode="decimal" />
        </Field>
        <Field label="Review count">
          <Input value={reviewCount} onChange={(event) => setReviewCount(event.target.value)} placeholder="126" inputMode="numeric" />
        </Field>
        <Field label="Website">
          <select value={hasWebsite} onChange={(event) => setHasWebsite(event.target.value)} className={selectClass}>
            <option value="">Unknown</option>
            <option value="yes">Has website</option>
            <option value="no">No website</option>
          </select>
        </Field>
        <Field label="Phone line">
          <select value={phoneLine} onChange={(event) => setPhoneLine(event.target.value)} className={selectClass}>
            <option value="">Unknown</option>
            <option value="mobile">Mobile</option>
            <option value="landline">Landline</option>
          </select>
        </Field>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" disabled={busy !== null} onClick={() => void addLead()}>
          {busy === "add" ? "Saving" : "Save business"}
        </Button>
        <Button type="button" variant="secondary" disabled={busy !== null} onClick={() => void generate()}>
          {busy === "gen" ? "Building" : "Build unclaimed links"}
        </Button>
      </div>
      {note ? <p className="mt-3 text-sm text-muted">{note}</p> : null}
      {links && links.links.length > 0 ? (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm text-muted">{links.links.length} unclaimed</p>
            <button
              type="button"
              className="inline-flex h-11 items-center gap-2 rounded-xl px-3 text-sm text-fg"
              onClick={() => {
                void navigator.clipboard.writeText(blob).then(() => setCopied(true)).catch(() => setCopied(false));
              }}
            >
              <Copy className="size-4" aria-hidden />
              {copied ? "Copied" : "Copy links"}
            </button>
          </div>
          <ul className="divide-y divide-line rounded-2xl bg-surface shadow-[0_0_0_1px_rgba(243,241,235,0.08)]">
            {links.links.map((link) => (
              <li key={link.leadSlug} className="px-4 py-3">
                <p className="text-sm font-medium">
                  {link.businessName} · {link.city}
                </p>
                <p className="mt-1 break-all text-sm text-muted">{link.url}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

const PULSE_LABEL: Record<string, string> = {
  booking_request: "Booking",
  booking_confirmed: "Confirmed",
  payment_received: "Payment",
  audit_request: "Estimate",
  audit_confirmed: "Estimate locked",
};

function PlatformWire() {
  const [rows, setRows] = useState<PlatformPulse[]>([]);
  const [lit, setLit] = useState(false);
  const seen = useRef(new Set<string>());
  const primed = useRef(false);

  useEffect(() => {
    let stop = false;
    const tick = () => {
      void listPlatformPulse()
        .then((next) => {
          if (stop) return;
          const fresh = next.filter((row) => !seen.current.has(row.id));
          for (const row of next) seen.current.add(row.id);
          setRows(next);
          if (!primed.current) {
            primed.current = true;
            return;
          }
          if (fresh.length === 0) return;
          const prefs = readFeedback("master");
          if (prefs.neon) {
            setLit(true);
            window.setTimeout(() => setLit(false), 1600);
          }
          if (prefs.haptics) pulseHaptic("incoming");
        })
        .catch(() => undefined);
    };
    tick();
    const timer = window.setInterval(tick, 2000);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <section className="mt-8">
      {lit ? <div className="axiom-ring" data-state="alert" aria-hidden="true" /> : null}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl">Live wire</h2>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Bookings, payments, and estimates from every shop land here as they happen.
          </p>
        </div>
      </div>
      <div className="mt-4 max-w-xl">
        <FeedbackToggles scope="master" />
      </div>
      <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl bg-surface shadow-[0_0_0_1px_rgba(243,241,235,0.08)]">
        {rows.length === 0 ? (
          <li className="px-4 py-6 text-sm text-muted">No live events yet.</li>
        ) : (
          rows.map((row, index) => (
            <li
              key={row.id}
              className={`px-4 py-3 text-sm ${index === 0 && lit ? "shadow-[inset_3px_0_0_0_#2ee6d6]" : ""}`}
            >
              <p className="font-medium">
                {PULSE_LABEL[row.type] ?? row.type} · {row.shopName}
              </p>
              {row.detail ? <p className="mt-1 whitespace-pre-line text-muted">{row.detail}</p> : null}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

function CommandStrip({ desk }: { desk: Desk }) {
  const jackson = desk.attribution.filter((row) => row.county.toLowerCase().includes("jackson"));
  const jacksonLeads = jackson.reduce((sum, row) => sum + row.leads, 0);
  const queues = new Map<string, number>();
  for (const row of desk.attribution) {
    const label = row.tradeLabel || row.tradeType;
    queues.set(label, (queues.get(label) ?? 0) + row.leads);
  }
  const splits = [...queues.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  return (
    <section className="mt-6 grid gap-3 lg:grid-cols-3">
      <div className="lift-card rounded-2xl bg-surface/80 p-4 backdrop-blur-md">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Jackson County</p>
        <p className="mt-2 font-display text-3xl tabular">{jacksonLeads.toLocaleString()}</p>
        <p className="mt-1 text-sm text-muted">{jackson.length} trade queues on the regional list</p>
      </div>
      <div className="lift-card rounded-2xl bg-surface/80 p-4 backdrop-blur-md">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Trickle worker</p>
        <p className="mt-2 font-display text-3xl capitalize">{desk.outreach.mode}</p>
        <p className="mt-1 text-sm text-muted">
          {desk.outreach.chunkSize} leads every {desk.outreach.intervalSeconds}s · database {desk.database}
        </p>
      </div>
      <div className="lift-card rounded-2xl bg-surface/80 p-4 backdrop-blur-md">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Niche queues</p>
        <ul className="mt-3 space-y-1 text-sm">
          {splits.length === 0 ? (
            <li className="text-muted">No regional lists yet.</li>
          ) : (
            splits.map(([label, count]) => (
              <li key={label} className="flex justify-between gap-3">
                <span className="truncate">{label}</span>
                <span className="tabular text-muted">{count.toLocaleString()}</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </section>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface px-4 py-4 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]">
      <p className="text-xs uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-2 font-display text-3xl">{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5 text-sm">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function when(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
