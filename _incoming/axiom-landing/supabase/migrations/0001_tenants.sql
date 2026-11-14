-- Axiom white-label tenants. Run in Supabase → SQL Editor (or `supabase db push`).

create table if not exists public.tenants (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique check (slug ~ '^[a-z0-9-]{3,60}$'),
  status            text not null default 'pending_payment'
                    check (status in ('pending_payment', 'pending_review', 'active', 'suspended')),
  build_id          text not null,
  plan              text not null default 'cinematic',
  business_name     text not null check (char_length(business_name) between 1 and 80),
  phone             text not null,
  logo_url          text,
  owner_name        text,
  email             text not null,
  stripe_session_id text,
  amount_paid_cents integer,
  created_at        timestamptz not null default now(),
  activated_at      timestamptz
);

create index if not exists tenants_status_idx on public.tenants (status);

-- Lock the table down: only the server (service-role key) reads/writes.
-- Public tenant sites are rendered server-side, so no anon policy is needed.
alter table public.tenants enable row level security;

-- Public bucket for buyer logos (served on the tenant's site).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('tenant-logos', 'tenant-logos', true, 2097152,
        array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])
on conflict (id) do nothing;
