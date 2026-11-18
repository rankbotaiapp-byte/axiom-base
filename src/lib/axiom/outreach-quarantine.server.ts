import { getSql } from "@/lib/db";
import { newId } from "@/lib/utils";
import { haltLeadDrip } from "./funnel-guard.server";
import {
  normalizeQuarantineDestination,
  quarantineReasonFromTelemetry,
  type QuarantineChannel,
  type QuarantineReason,
  type QuarantineSource,
} from "./outreach-quarantine";

type Sql = Awaited<ReturnType<typeof getSql>>;

function missingRelation(err: unknown): boolean {
  const message = err instanceof Error ? err.message : "";
  return /does not exist|undefined_table|undefined_column/i.test(message);
}

async function withSql<T>(run: (sql: Sql) => Promise<T>, fallback: T): Promise<T> {
  try {
    const sql = await getSql();
    return await run(sql);
  } catch (err) {
    if (missingRelation(err)) return fallback;
    throw err;
  }
}

function digitsOf(value: string): string {
  return value.replace(/\D/g, "");
}

async function resolveLeadSlugs(
  sql: Sql,
  input: { leadSlug?: string; channel: QuarantineChannel; destination: string },
): Promise<string[]> {
  const slugs = new Set<string>();
  if (input.leadSlug?.trim()) slugs.add(input.leadSlug.trim());
  const dest = normalizeQuarantineDestination(input.channel, input.destination);
  if (!dest) return [...slugs];

  if (input.channel === "email" || dest.includes("@")) {
    const rows = await sql<{ lead_slug: string }>`
      select lead_slug from preloaded_leads
      where lower(btrim(coalesce(contact_email, ''))) = ${dest}
        and lead_slug <> ''
      limit 12
    `.catch(() => [] as { lead_slug: string }[]);
    for (const row of rows) if (row.lead_slug) slugs.add(row.lead_slug);
    return [...slugs];
  }

  const digits = digitsOf(dest);
  if (digits.length >= 10) {
    const tail = digits.slice(-10);
    const rows = await sql<{ lead_slug: string }>`
      select lead_slug from preloaded_leads
      where regexp_replace(coalesce(contact_phone, ''), '\\D', '', 'g') like ${`%${tail}`}
        and lead_slug <> ''
      limit 12
    `.catch(() => [] as { lead_slug: string }[]);
    for (const row of rows) if (row.lead_slug) slugs.add(row.lead_slug);
  }
  return [...slugs];
}

async function upsertQuarantineRow(
  sql: Sql,
  row: {
    leadSlug: string;
    channel: QuarantineChannel;
    destination: string;
    reason: QuarantineReason;
    source: QuarantineSource;
  },
): Promise<boolean> {
  if (row.destination) {
    const existing = await sql<{ id: string }>`
      select id from outreach_lead_quarantine
      where channel = ${row.channel}
        and lower(destination) = ${row.destination.toLowerCase()}
      limit 1
    `.catch(() => [] as { id: string }[]);
    if (existing[0]?.id) {
      await sql`
        update outreach_lead_quarantine
        set reason = ${row.reason},
            source = ${row.source},
            lead_slug = case
              when btrim(${row.leadSlug}) <> '' then ${row.leadSlug.slice(0, 120)}
              else lead_slug
            end
        where id = ${existing[0].id}
      `;
      return true;
    }
  }

  if (row.leadSlug) {
    const bySlug = await sql<{ id: string }>`
      select id from outreach_lead_quarantine
      where lead_slug = ${row.leadSlug}
      limit 1
    `.catch(() => [] as { id: string }[]);
    if (bySlug[0]?.id) {
      await sql`
        update outreach_lead_quarantine
        set reason = ${row.reason},
            source = ${row.source},
            channel = ${row.channel},
            destination = case
              when btrim(${row.destination}) <> '' then ${row.destination.slice(0, 160)}
              else destination
            end
        where id = ${bySlug[0].id}
      `;
      return true;
    }
  }

  await sql`
    insert into outreach_lead_quarantine (id, lead_slug, channel, destination, reason, source)
    values (
      ${newId("qtn")},
      ${row.leadSlug.slice(0, 120)},
      ${row.channel},
      ${row.destination.slice(0, 160)},
      ${row.reason},
      ${row.source}
    )
  `;
  return true;
}

export async function quarantineLead(input: {
  leadSlug?: string;
  channel: QuarantineChannel;
  destination?: string;
  reason: QuarantineReason;
  source: QuarantineSource;
}): Promise<{ quarantined: number; halted: number }> {
  return withSql(async (sql) => {
    const destination = normalizeQuarantineDestination(input.channel, input.destination ?? "");
    const slugs = await resolveLeadSlugs(sql, {
      leadSlug: input.leadSlug,
      channel: input.channel,
      destination,
    });

    let quarantined = 0;
    if (destination || slugs.length === 0) {
      const ok = await upsertQuarantineRow(sql, {
        leadSlug: slugs[0] ?? input.leadSlug ?? "",
        channel: input.channel,
        destination,
        reason: input.reason,
        source: input.source,
      });
      if (ok) quarantined += 1;
    }

    let halted = 0;
    for (const slug of slugs) {
      await upsertQuarantineRow(sql, {
        leadSlug: slug,
        channel: "any",
        destination: "",
        reason: input.reason,
        source: input.source,
      });
      quarantined += 1;
      halted += await haltLeadDrip(sql, slug, "replied");
    }

    return { quarantined, halted };
  }, { quarantined: 0, halted: 0 });
}

export async function quarantineFromTelemetryEvent(event: {
  channel: "sms" | "email";
  eventType: string;
  errorCode?: string;
  destination?: string;
}): Promise<{ quarantined: number; halted: number; reason: QuarantineReason | null }> {
  const reason = quarantineReasonFromTelemetry(event.eventType, event.errorCode ?? "");
  if (!reason) return { quarantined: 0, halted: 0, reason: null };
  const result = await quarantineLead({
    channel: event.channel,
    destination: event.destination,
    reason,
    source: event.channel === "sms" ? "twilio" : "resend",
  });
  return { ...result, reason };
}

export async function countQuarantinedLeads(): Promise<number> {
  return withSql(async (sql) => {
    const rows = await sql<{ n: number }>`
      select count(*)::int as n from outreach_lead_quarantine
    `;
    return Number(rows[0]?.n ?? 0) || 0;
  }, 0);
}
