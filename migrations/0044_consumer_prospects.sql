-- Daily consumer prospects, copied into the existing tenant_leads queue on scan.
-- tenant_leads already stores a shop slug, a name, a category, and contact fields.
-- New columns remember which prospect was pulled and on which day.

create table if not exists consumer_prospects (
  id                uuid primary key default gen_random_uuid(),
  niche             text not null,
  city              text not null,
  consumer_name     text not null,
  consumer_contact  text not null,
  note              text not null default '',
  batch_date        date not null default current_date,
  created_at        timestamptz not null default now()
);

create index if not exists consumer_prospects_daily_idx
  on consumer_prospects (niche, city, batch_date);

alter table tenant_leads add column if not exists prospect_id uuid references consumer_prospects(id) on delete cascade;
alter table tenant_leads add column if not exists consumer_contact text not null default '';
alter table tenant_leads add column if not exists note text not null default '';
alter table tenant_leads add column if not exists scanned_on date;
alter table tenant_leads add column if not exists niche text not null default '';
alter table tenant_leads add column if not exists city text not null default '';

create unique index if not exists tenant_leads_slug_prospect_idx
  on tenant_leads (tenant_slug, prospect_id)
  where prospect_id is not null;

create index if not exists tenant_leads_slug_created_idx
  on tenant_leads (tenant_slug, created_at desc);

alter table consumer_prospects enable row level security;
alter table tenant_leads enable row level security;

drop policy if exists tenant_leads_member_read on tenant_leads;
create policy tenant_leads_member_read on tenant_leads
  for select using (
    exists (
      select 1 from shops s
      where s.slug = tenant_leads.tenant_slug
        and (is_shop_owner(s.id) or is_shop_member(s.id))
    )
  );

-- Sample batch for the day this migration runs. Contacts are invented.
insert into consumer_prospects (niche, city, consumer_name, consumer_contact, note, batch_date)
values
  ('location', 'New Era', 'Avery Cole', '555-010-2001', 'Wants a fade this week.', current_date),
  ('location', 'New Era', 'Jordan Hale', 'jordan.hale@example.com', 'Beard lineup, after work.', current_date),
  ('location', 'Hoboken', 'Mina Cho', '555-010-2002', 'Walk-in if a chair is open.', current_date),
  ('location', 'Hoboken', 'Luis Ortega', 'luis.ortega@example.com', 'Asked for a hot towel.', current_date),
  ('field', 'Red Hook', 'Sam Ortega', '555-010-2003', 'Car will not start at the curb.', current_date),
  ('field', 'Red Hook', 'Riley Chen', 'riley.chen@example.com', 'Needs a look before the weekend.', current_date),
  ('contractor', 'New Era', 'Hank Briggs', '555-010-2004', 'Small repair at the house.', current_date),
  ('landscaper', 'New Era', 'Pat Nguyen', 'pat.nguyen@example.com', 'Yard needs a cleanup.', current_date),
  ('foodtruck', 'New Era', 'Rosa Vega', '555-010-2005', 'Lunch stop for a crew of twenty.', current_date),
  ('locksmith', 'New Era', 'Casey Quinn', 'casey.quinn@example.com', 'Locked out of the shop.', current_date),
  ('firewood', 'New Era', 'Jules Marin', '555-010-2006', 'Wants a half cord dropped.', current_date),
  ('creator', 'New Era', 'Owen Blake', 'owen.blake@example.com', 'Needs a short video cut.', current_date);
