-- Brand DNA for hero generation, plus prepaid AI credits billed through Stripe.

create table if not exists shop_branding (
  shop_id text primary key references shops(id) on delete cascade,
  dna text not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists shop_ai_credits (
  shop_id text primary key references shops(id) on delete cascade,
  balance integer not null default 0,
  stripe_customer_id text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists shop_ai_usage (
  id text primary key,
  shop_id text not null references shops(id) on delete cascade,
  kind text not null,
  units integer not null,
  stripe_ref text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists shop_ai_usage_shop_idx on shop_ai_usage (shop_id, created_at desc);

alter table if exists shop_branding enable row level security;
alter table if exists shop_ai_credits enable row level security;
alter table if exists shop_ai_usage enable row level security;

drop policy if exists shop_branding_public_read on shop_branding;
create policy shop_branding_public_read on shop_branding for select using (true);

drop policy if exists shop_ai_credits_public_read on shop_ai_credits;
drop policy if exists shop_ai_usage_public_read on shop_ai_usage;
