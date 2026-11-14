-- Contractor social OAuth (Facebook / Instagram / Google Business). Server-only.

create table if not exists public.shop_social_accounts (
  id text primary key,
  shop_id text not null,
  platform text not null check (platform in ('facebook', 'instagram', 'gbp')),
  page_id text not null default '',
  ig_user_id text not null default '',
  gbp_account_id text not null default '',
  gbp_location_id text not null default '',
  access_token text not null default '',
  refresh_token text not null default '',
  token_expires_at timestamptz,
  token_refreshed_at timestamptz,
  status text not null default 'active' check (status in ('active', 'needs_reauth', 'revoked')),
  scopes text not null default '',
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, platform)
);

create index if not exists shop_social_accounts_shop_idx
  on public.shop_social_accounts (shop_id, platform);

alter table public.shop_social_accounts enable row level security;
