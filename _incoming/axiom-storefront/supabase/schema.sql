-- Axiom storefront: tenants, content engine, channels.
-- Bookings reuse the existing AXIOM `orders` table (business_id = tenant slug).

create extension if not exists pgcrypto;

create table if not exists axiom_tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  niche text not null,
  city text not null,
  region text not null,
  street text,
  postal_code text,
  phone text not null,
  email text not null,
  website text,
  plan text not null check (plan in ('starter','lifetime','custom')),
  status text not null default 'preview' check (status in ('preview','active','paused')),
  config jsonb not null default '{}'::jsonb,
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists axiom_posts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references axiom_tenants(id) on delete cascade,
  slug text not null,
  kind text not null check (kind in ('article','gbp','social')),
  title text not null,
  body text not null,
  excerpt text not null default '',
  keywords text[] not null default '{}',
  cta text,
  image_prompt text,
  status text not null default 'scheduled' check (status in ('draft','scheduled','published','failed')),
  scheduled_for timestamptz not null,
  published_at timestamptz,
  results jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (tenant_id, slug)
);
create index if not exists axiom_posts_due on axiom_posts (status, scheduled_for);

-- Per-tenant publishing channels. Credentials are server-only:
-- in production move `credentials` into Supabase Vault and store the secret id here.
create table if not exists axiom_channels (
  tenant_id uuid not null references axiom_tenants(id) on delete cascade,
  platform text not null check (platform in ('webhook','facebook','instagram','gbp')),
  enabled boolean not null default true,
  credentials jsonb not null default '{}'::jsonb,
  primary key (tenant_id, platform)
);

-- Lock everything down: only the service role (server) reads/writes.
alter table axiom_tenants enable row level security;
alter table axiom_posts enable row level security;
alter table axiom_channels enable row level security;
