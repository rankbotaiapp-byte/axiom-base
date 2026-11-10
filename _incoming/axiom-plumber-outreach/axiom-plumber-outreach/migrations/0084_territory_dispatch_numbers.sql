-- Post-checkout mobile lock for the plumber outreach page (/t/{slug}?niche=plumbing).
-- One direct cell per activated territory; "Test Live SMS Dispatch" texts it.
-- Rows are written only by server code after Stripe confirms the payment.

create table if not exists territory_dispatch_numbers (
  lead_slug text primary key,
  phone text not null,
  payment_ref text not null,
  test_count integer not null default 0,
  last_test_at timestamptz,
  last_test_status text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table territory_dispatch_numbers enable row level security;
