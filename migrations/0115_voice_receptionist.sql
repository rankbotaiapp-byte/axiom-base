-- 24/7 live AI voice receptionist: per-tenant price book, call sessions, spend caps.

alter table if exists services
  add column if not exists trade text not null default '';

alter table if exists services
  add column if not exists pricing_mode text not null default 'starting_at';

alter table if exists services
  add column if not exists min_price_cents integer not null default 0;

alter table if exists services
  add column if not exists max_price_cents integer not null default 0;

alter table if exists services
  add column if not exists deposit_cents integer not null default 0;

alter table if exists services
  add column if not exists active boolean not null default true;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'services_pricing_mode_check'
  ) then
    alter table services
      add constraint services_pricing_mode_check
      check (pricing_mode in ('fixed', 'range', 'starting_at'));
  end if;
end $$;

update services
set
  min_price_cents = case when min_price_cents = 0 then price_cents else min_price_cents end,
  max_price_cents = case when max_price_cents = 0 then price_cents else max_price_cents end
where price_cents > 0;

create index if not exists services_shop_active_idx
  on services (shop_id, active, sort_order);

alter table if exists shops
  add column if not exists voice_answer_mode text not null default 'immediate';

alter table if exists shops
  add column if not exists voice_daily_cap_cents integer not null default 2500;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'shops_voice_answer_mode_check'
  ) then
    alter table shops
      add constraint shops_voice_answer_mode_check
      check (voice_answer_mode in ('immediate', 'ring_overflow'));
  end if;
end $$;

create table if not exists voice_call_sessions (
  call_sid          text primary key,
  shop_id           text not null references shops(id) on delete cascade,
  from_phone        text not null default '',
  to_phone          text not null default '',
  status            text not null default 'active'
                    check (status in ('active', 'booked', 'fallback', 'ended', 'capped')),
  turns             integer not null default 0,
  spend_cents       integer not null default 0,
  booked            boolean not null default false,
  appointment_id    text,
  quote_id          text,
  payload           jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists voice_call_sessions_shop_idx
  on voice_call_sessions (shop_id, created_at desc);

create table if not exists voice_spend_ledger (
  id            text primary key,
  shop_id       text not null references shops(id) on delete cascade,
  call_sid      text not null default '',
  cents         integer not null default 0,
  kind          text not null default 'turn',
  created_at    timestamptz not null default now()
);

create index if not exists voice_spend_ledger_day_idx
  on voice_spend_ledger (shop_id, created_at desc);
