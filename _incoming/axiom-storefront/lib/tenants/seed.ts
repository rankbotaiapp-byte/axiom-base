import { defaultConfig } from "./factory";
import type { Channel, Post, Tenant, Booking } from "./types";

/** Demo data for running without Supabase. Fictional business. */
export function seedDemo(): {
  tenants: Tenant[];
  posts: Post[];
  channels: Channel[];
  bookings: (Booking & { created_at: string })[];
} {
  const created = "2026-10-01T16:00:00.000Z";
  const t: Tenant = {
    id: "00000000-0000-4000-8000-000000000001",
    slug: "ridgeline-barber-co-medford",
    name: "Ridgeline Barber Co.",
    niche: "barber",
    city: "Medford",
    region: "OR",
    street: null,
    postalCode: "97501",
    phone: "+1-541-555-0142",
    email: "demo@example.com",
    website: null,
    plan: "starter",
    status: "active",
    config: {
      ...defaultConfig("barber", "Ridgeline Barber Co.", "Medford", "OR"),
      serviceArea: ["Medford", "Central Point", "Jacksonville", "Phoenix"],
    },
    createdAt: created,
    updatedAt: created,
  };
  const posts: Post[] = [
    {
      id: "00000000-0000-4000-8000-0000000000a1",
      tenantId: t.id,
      slug: "how-often-should-you-get-a-fade-medford",
      kind: "article",
      title: "How Often Should You Get a Fade? A Medford Barber's Guide",
      excerpt: "Skin fades grow out fast. Here's the schedule our Medford chairs recommend for keeping a fade sharp.",
      body: "A skin fade looks its best for about two weeks. After that the blend softens and the line-up loses its edge.\n\n## The short answer\n- Skin or bald fade: every 2 weeks\n- Low or mid taper: every 3 weeks\n- Longer scissor cuts: every 4–6 weeks\n\n## Why Medford weather matters\nDry summers in the Rogue Valley mean scalp care matters as much as the cut. Ask for a hot towel finish to calm irritation after a close fade.\n\n## Book it once, keep it sharp\nBook your next fade before you leave the chair, or set it up any time online.",
      keywords: ["fade haircut Medford", "barber Medford OR", "skin fade schedule"],
      cta: "Book a fade",
      imagePrompt: null,
      status: "published",
      scheduledFor: "2026-10-20T15:00:00.000Z",
      publishedAt: "2026-10-20T15:00:00.000Z",
      results: { web: { ok: true, at: "2026-10-20T15:00:00.000Z" } },
      createdAt: created,
    },
  ];
  return { tenants: [t], posts, channels: [], bookings: [] };
}
