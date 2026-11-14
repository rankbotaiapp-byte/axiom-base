-- Multi-day drip halt statuses and Gear Guardian platform-fee ledger.

create table if not exists platform_fees (
  id              text primary key,
  shop_id         text not null references shops(id) on delete cascade,
  appointment_id  text,
  amount_cents    integer not null check (amount_cents >= 0),
  bps             integer not null default 150,
  stripe_ref      text not null default '',
  created_at      timestamptz not null default now(),
  unique (stripe_ref)
);

create index if not exists platform_fees_shop_idx
  on platform_fees (shop_id, created_at desc);

alter table platform_fees enable row level security;

-- Collapse the old Day 2 / Day 6 nurture into Day 0 / 3 / 7.
update outreach_touches t
set step = 7,
    label = 'Day 7 Final closing',
    scheduled_at = s.created_at + interval '7 days'
from outreach_sequences s
where t.sequence_id = s.id
  and t.status = 'scheduled'
  and t.step = 6
  and not exists (
    select 1 from outreach_touches x
    where x.sequence_id = t.sequence_id and x.step = 7
  );

update outreach_touches
set status = 'skipped'
where status = 'scheduled' and step in (2, 6);
