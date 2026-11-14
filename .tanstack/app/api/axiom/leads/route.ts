import { NextResponse } from 'next/server';
import { getGuidedFishingConfig } from '@/lib/axiom/guided-fishing/getTenantConfig';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * >>> AXIOM INTEGRATION POINT 3 of 3 <<<
 * Validates a storefront lead and hands it to the Axiom outbound engine,
 * which owns the SMS + email confirmation flows.
 *
 * Env:
 *   AXIOM_OUTBOUND_WEBHOOK_URL   engine endpoint that accepts the JSON event below
 *   AXIOM_OUTBOUND_SECRET        sent as a Bearer token (optional)
 *
 * In production a missing webhook returns 503 on purpose: the form then tells
 * the visitor to call instead. A lead must never be silently dropped.
 */

const clean = (value: unknown, max: number) =>
  typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, max) : '';

function toE164(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }

  // Honeypot: bots fill the hidden "company" field. Pretend success, send nothing.
  if (clean(body.company, 100)) return NextResponse.json({ ok: true });

  const config = await getGuidedFishingConfig(clean(body.tenantId, 64));
  if (!config) return NextResponse.json({ ok: false, error: 'Unknown business.' }, { status: 404 });

  const name = clean(body.name, 80);
  const email = clean(body.email, 120).toLowerCase();
  const phoneRaw = clean(body.phone, 30);
  const phone = phoneRaw ? toE164(phoneRaw) : null;
  const message = clean(body.message, 1000);
  const smsConsent = body.smsConsent === true && phone !== null;

  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = 'Please enter your name.';
  if (phoneRaw && !phone) errors.phone = 'Enter a 10-digit US phone number.';
  if (email && !EMAIL.test(email)) errors.email = 'Enter a valid email address.';
  if (!phone && !email) errors.phone = errors.phone ?? 'Add a phone number or an email so we can reach you.';
  if (Object.keys(errors).length) {
    return NextResponse.json({ ok: false, error: 'Please fix the highlighted fields.', fields: errors }, { status: 422 });
  }

  // Trip details: price and name come from tenant config, never from the client.
  const trip = (body.trip ?? null) as Record<string, unknown> | null;
  const tier = trip ? config.pricing.tiers.find((t) => t.id === clean(trip.tierId, 64)) : undefined;
  const date = trip ? clean(trip.date, 10) : '';
  const anglers = trip ? Math.min(Math.max(Math.trunc(Number(trip.anglers)) || 1, 1), config.pricing.maxAnglers) : 1;

  const event = {
    event: 'lead.created',
    module: 'guided-fishing',
    tenantId: config.tenantId,
    businessName: config.business.name,
    lead: { name, phone, email: email || null, message: message || null },
    trip: tier
      ? {
          tierId: tier.id,
          tierName: tier.name,
          price: tier.price,
          priceIsFrom: Boolean(tier.priceSuffix),
          date: ISO_DATE.test(date) ? date : null,
          anglers,
        }
      : null,
    consent: {
      sms: smsConsent,
      // Stored with the lead so there is a record of exactly what the visitor agreed to.
      smsDisclosure: smsConsent ? config.lead.smsConsentText : null,
      capturedAt: new Date().toISOString(),
    },
    flows: {
      customerSmsConfirmation: smsConsent,
      customerEmailConfirmation: Boolean(email),
      ownerAlert: true,
    },
    source: {
      page: clean(body.page, 300) || null,
      referrer: clean(body.referrer, 300) || null,
      userAgent: clean(request.headers.get('user-agent'), 300) || null,
    },
  };

  const webhook = process.env.AXIOM_OUTBOUND_WEBHOOK_URL;
  if (!webhook) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[axiom/leads] AXIOM_OUTBOUND_WEBHOOK_URL is not set — lead NOT delivered', event);
      return NextResponse.json({ ok: false, error: 'Booking requests are temporarily offline.' }, { status: 503 });
    }
    console.info('[axiom/leads] dev mode, no webhook configured. Event that would be sent:\n', JSON.stringify(event, null, 2));
    return NextResponse.json({ ok: true, delivered: false });
  }

  try {
    const res = await fetch(webhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.AXIOM_OUTBOUND_SECRET ? { Authorization: `Bearer ${process.env.AXIOM_OUTBOUND_SECRET}` } : {}),
      },
      body: JSON.stringify(event),
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`engine responded ${res.status}`);
  } catch (error) {
    console.error('[axiom/leads] outbound engine delivery failed', error, event);
    return NextResponse.json({ ok: false, error: 'We could not send your request.' }, { status: 502 });
  }

  return NextResponse.json({ ok: true, delivered: true });
}
