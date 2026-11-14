/**
 * Verify Twilio SMS + Resend email dispatches from the latest autopilot tick.
 *
 *   node --env-file=.env ./node_modules/ts-node/dist/bin-esm.js scripts/verify-outbound.ts
 */
const SMS_CAP = Number(process.env.OUTREACH_SMS_DAILY_CAP) || 40;
const EMAIL_CAP = Number(process.env.OUTREACH_EMAIL_DAILY_CAP) || 80;
const WINDOW_MS = 15 * 60 * 1000;
const PACIFIC = "America/Los_Angeles";

type QueueRow = {
  id: string;
  channel: string;
  status: string;
  phone?: string | null;
  email?: string | null;
  sent_at?: string | null;
  scheduled_for?: string | null;
  detail?: string | null;
  business_name?: string | null;
};

type TelemetryRow = {
  provider: string;
  channel: string;
  event_type: string;
  destination: string;
  identity?: string;
  created_at: string;
};

type DispatchRow = {
  channel: string;
  status: string;
  mode?: string;
  lead_count?: number;
  sent_at?: string | null;
  created_at?: string;
  detail?: string;
};

function requiredEnv(): { url: string; key: string } {
  const url = (
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    ""
  )
    .trim()
    .replace(/\/$/, "");
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ""
  ).trim();
  if (!url || !key) {
    console.error("[verify-outbound] Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }
  return { url, key };
}

async function rest<T>(url: string, key: string, table: string, query: string): Promise<T[]> {
  const endpoint = `${url}/rest/v1/${table}?${query}`;
  const res = await fetch(endpoint, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 240);
    throw new Error(`${table} ${res.status}${detail ? `: ${detail}` : ""}`);
  }
  return (await res.json()) as T[];
}

function pacificYmd(value: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: PACIFIC }).format(value);
}

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return "****";
  return `***${digits.slice(-4)}`;
}

function maskEmail(value: string): string {
  const at = value.indexOf("@");
  if (at < 1) return "***";
  const local = value.slice(0, at);
  const domain = value.slice(at + 1);
  const head = local.slice(0, 1);
  return `${head}***@${domain}`;
}

function destination(row: QueueRow | TelemetryRow): { channel: string; dest: string } {
  if ("destination" in row) {
    const dest = row.destination || "";
    return {
      channel: row.channel,
      dest: dest.includes("@") ? maskEmail(dest) : maskPhone(dest),
    };
  }
  if (row.channel === "sms") return { channel: "sms", dest: maskPhone(row.phone || "") };
  return { channel: "email", dest: maskEmail(row.email || "") };
}

function when(row: { sent_at?: string | null; created_at?: string; scheduled_for?: string | null }): Date {
  const raw = row.sent_at || row.created_at || row.scheduled_for || "";
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? new Date(0) : d;
}

function printRows(title: string, rows: Array<{ channel: string; status: string; dest: string; at: string; extra?: string }>) {
  console.log(`\n${title}`);
  if (rows.length === 0) {
    console.log("  (none)");
    return;
  }
  for (const row of rows) {
    const extra = row.extra ? ` · ${row.extra}` : "";
    console.log(`  ${row.channel.padEnd(5)}  ${row.status.padEnd(12)}  ${row.dest.padEnd(22)}  ${row.at}${extra}`);
  }
}

async function main(): Promise<void> {
  const { url, key } = requiredEnv();
  const now = new Date();
  const since = new Date(now.getTime() - WINDOW_MS);
  const sinceIso = since.toISOString();
  const lookbackIso = new Date(now.getTime() - 36 * 60 * 60 * 1000).toISOString();
  const today = pacificYmd(now);
  const mode = (process.env.OUTREACH_MODE || "simulation").trim().toLowerCase();

  console.log("Axiom outbound verification");
  console.log(`Window: last 15 minutes (since ${sinceIso})`);
  console.log(`Pacific day: ${today}  ·  caps  ${SMS_CAP} SMS / ${EMAIL_CAP} email  ·  OUTREACH_MODE=${mode || "simulation"}`);

  const queue = await rest<QueueRow>(
    url,
    key,
    "outreach_queue",
    [
      "select=id,channel,status,phone,email,sent_at,scheduled_for,detail,business_name",
      `or=(sent_at.gte.${lookbackIso},scheduled_for.gte.${lookbackIso},created_at.gte.${lookbackIso})`,
      "order=sent_at.desc.nullslast",
      "limit=500",
    ].join("&"),
  ).catch((err: Error) => {
    console.log(`\noutreach_queue unavailable: ${err.message}`);
    return [] as QueueRow[];
  });

  const telemetry = await rest<TelemetryRow>(
    url,
    key,
    "outreach_telemetry_logs",
    [
      "select=provider,channel,event_type,destination,identity,created_at",
      `created_at=gte.${lookbackIso}`,
      "order=created_at.desc",
      "limit=500",
    ].join("&"),
  ).catch((err: Error) => {
    console.log(`outreach_telemetry_logs unavailable: ${err.message}`);
    return [] as TelemetryRow[];
  });

  const dispatches = await rest<DispatchRow>(
    url,
    key,
    "outreach_dispatches",
    [
      "select=channel,status,mode,lead_count,sent_at,created_at,detail",
      `or=(sent_at.gte.${lookbackIso},created_at.gte.${lookbackIso})`,
      "order=sent_at.desc.nullslast",
      "limit=200",
    ].join("&"),
  ).catch((err: Error) => {
    console.log(`outreach_dispatches unavailable: ${err.message}`);
    return [] as DispatchRow[];
  });

  const recentQueue = queue.filter((row) => when(row) >= since);
  const recentTel = telemetry.filter((row) => when(row) >= since);
  const recentDisp = dispatches.filter((row) => when(row) >= since);

  const smsOk = (status: string) => /^(sent|queued|logged|delivered)$/i.test(status);
  const recentSms = [
    ...recentQueue.filter((row) => row.channel === "sms" && smsOk(row.status)),
    ...recentTel.filter((row) => row.channel === "sms" && /sent|queued|delivered/i.test(row.event_type)),
  ];
  const recentEmail = [
    ...recentQueue.filter((row) => row.channel === "email" && smsOk(row.status)),
    ...recentTel.filter((row) => row.channel === "email" && /sent|queued|delivered/i.test(row.event_type)),
  ];

  console.log("\nLast 15 minutes (successful Twilio / Resend)");
  console.log(`  SMS (Twilio):   ${recentSms.length}`);
  console.log(`  Email (Resend): ${recentEmail.length}`);

  printRows(
    "Destinations · last 15 minutes (queue)",
    recentQueue.map((row) => {
      const d = destination(row);
      return {
        channel: d.channel,
        status: row.status,
        dest: d.dest,
        at: when(row).toISOString(),
        extra: row.detail?.slice(0, 80) || row.business_name || undefined,
      };
    }),
  );

  printRows(
    "Destinations · last 15 minutes (Twilio/Resend telemetry)",
    recentTel.map((row) => {
      const d = destination(row);
      return {
        channel: `${row.provider}/${d.channel}`,
        status: row.event_type,
        dest: d.dest,
        at: when(row).toISOString(),
      };
    }),
  );

  if (recentDisp.length) {
    printRows(
      "Campaign chunks · last 15 minutes",
      recentDisp.map((row) => ({
        channel: row.channel,
        status: row.status,
        dest: `${row.mode || "?"} ×${row.lead_count ?? 0}`,
        at: when(row).toISOString(),
        extra: row.detail?.slice(0, 80),
      })),
    );
  }

  const dailySms = queue.filter(
    (row) => row.channel === "sms" && smsOk(row.status) && row.sent_at && pacificYmd(new Date(row.sent_at)) === today,
  ).length;
  const dailyEmail = queue.filter(
    (row) => row.channel === "email" && smsOk(row.status) && row.sent_at && pacificYmd(new Date(row.sent_at)) === today,
  ).length;
  const rateLimitedSms = queue.filter((row) => row.channel === "sms" && row.status === "rate_limited").length;
  const rateLimitedEmail = queue.filter((row) => row.channel === "email" && row.status === "rate_limited").length;

  const smsOkCap = dailySms <= SMS_CAP;
  const emailOkCap = dailyEmail <= EMAIL_CAP;

  console.log("\nMaster outbound limits (Pacific day)");
  console.log(`  SMS   ${dailySms} / ${SMS_CAP}  ${smsOkCap ? "OK" : "OVER CAP"}  rate_limited rows: ${rateLimitedSms}`);
  console.log(`  Email ${dailyEmail} / ${EMAIL_CAP}  ${emailOkCap ? "OK" : "OVER CAP"}  rate_limited rows: ${rateLimitedEmail}`);
  console.log(
    smsOkCap && emailOkCap
      ? "  Caps respected: no channel exceeded the 40 SMS / 80 email daily ceiling."
      : "  Caps breached: inspect rate_limited rows and OUTREACH_*_DAILY_CAP overrides.",
  );

  if (recentSms.length === 0 && recentEmail.length === 0) {
    console.log("\nNo carrier sends in the window. Shop-autopilot ticks notify shop owners;");
    console.log("live Twilio/Resend fire only when OUTREACH_MODE=live and outreach_queue rows are due.");
  }
}

main().catch((err) => {
  console.error("[verify-outbound]", err instanceof Error ? err.message : err);
  process.exit(1);
});
