-- Run once in the Supabase SQL editor.
-- Also create a PUBLIC storage bucket named "logos".

create table if not exists tenant_drafts (
  id uuid primary key,
  business_name text not null,
  trade text not null check (trade in ('plumbing','hvac','electrical')),
  color_scheme text not null,
  logo_url text,
  requested_slug text not null,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  business_name text not null,
  trade text not null,
  color_scheme text not null,
  logo_url text,
  owner_email text,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_session_id text not null unique,
  status text not null default 'trialing',
  created_at timestamptz not null default now()
);

-- Both tables are written only by the service role from API routes.
alter table tenant_drafts enable row level security;
alter table tenants enable row level security;

-- Public storefronts may read live tenants.
create policy "public read tenants" on tenants
  for select using (status in ('trialing','active'));
