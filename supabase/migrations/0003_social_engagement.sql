create table if not exists public.shop_social_inbox (
  id text primary key,
  shop_id text not null,
  platform text not null check (platform in ('facebook', 'instagram', 'gbp')),
  kind text not null default 'comment',
  external_id text not null,
  parent_id text not null default '',
  from_id text not null default '',
  from_name text not null default '',
  body text not null default '',
  intent text not null default 'question',
  reply text not null default '',
  replied_at timestamptz,
  lead_id text,
  status text not null default 'new' check (status in ('new', 'replied', 'skipped', 'failed')),
  created_at timestamptz not null default now()
);

create unique index if not exists shop_social_inbox_external_idx
  on public.shop_social_inbox (external_id);

alter table public.shop_social_inbox enable row level security;

alter table if exists public.consumer_leads
  add column if not exists shop_id text;

alter table if exists public.consumer_leads
  add column if not exists source text not null default '';
