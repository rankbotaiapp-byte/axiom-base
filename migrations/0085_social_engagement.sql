-- Inbound social comments, DMs, and GBP reviews. Idempotent inbox + warm-lead shop link.

create table if not exists shop_social_inbox (
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
  on shop_social_inbox (external_id);

create index if not exists shop_social_inbox_shop_idx
  on shop_social_inbox (shop_id, created_at desc);

alter table if exists shop_social_inbox enable row level security;

alter table if exists consumer_leads
  add column if not exists shop_id text;

alter table if exists consumer_leads
  add column if not exists source text not null default '';

create index if not exists consumer_leads_shop_idx
  on consumer_leads (shop_id, created_at desc)
  where shop_id is not null;
