-- Live Graph / GBP publishing: OAuth tokens, delivery receipts, tenant Stripe lead.

create table if not exists shop_social_accounts (
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
  on shop_social_accounts (shop_id, platform);

alter table if exists shop_social_posts
  add column if not exists delivered jsonb not null default '[]'::jsonb;

alter table if exists shop_social_posts
  add column if not exists published_at timestamptz;

alter table if exists shop_social_posts
  add column if not exists last_error text not null default '';

alter table if exists shop_social_accounts enable row level security;

insert into preloaded_leads (
  id, business_name, trade_type, city, county, lead_slug, claimed,
  contact_phone, contact_name, phone_line, account_mode, trade_label,
  source, niche, state, active
)
select
  'lead_accurateplumb01',
  'Accurate Plumbing',
  'plumbing',
  'Medford',
  'Jackson County',
  'accurate-plumbing',
  false,
  '(541) 555-0100',
  'Accurate Plumbing',
  '(541) 555-0100',
  'simulation',
  'Plumbing',
  'tenant-storefront',
  'plumbing',
  'OR',
  true
where not exists (
  select 1 from preloaded_leads where lead_slug = 'accurate-plumbing'
);
