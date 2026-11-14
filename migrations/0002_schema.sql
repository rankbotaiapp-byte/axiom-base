-- Axiom multi-tenant schema.
-- Application-layer tenant isolation is mandatory (server functions scope
-- every privileged query by verified user id). RLS below documents the same
-- contract for a restricted role / a later Supabase port: replace
-- app_current_user_id() with auth.uid()::text there. Table owners (this
-- connection) bypass RLS unless FORCE ROW LEVEL SECURITY is set — we do not
-- force it, so preview/Neon still work.

create table if not exists shops (
  id                   text primary key,
  slug                 text not null unique,
  name                 text not null,
  niche                text not null check (niche in ('location', 'field')),
  tagline              text not null default '',
  description          text not null default '',
  ring_color           text not null default '#2EE6D6',
  hero_image_url       text not null default '/media/barber-hero.jpg',
  hero_video_url       text,
  hero_blend_percent   integer not null default 62,
  primary_service_id   text,
  owner_user_id        text,
  is_showcase          boolean not null default false,
  onboarding_step      text not null default 'generated',
  onboarding_json      text not null default '{}',
  hours_json           text not null default '{"mon":"09:00-18:00","tue":"09:00-18:00","wed":"09:00-18:00","thu":"09:00-18:00","fri":"09:00-18:00","sat":"09:00-16:00","sun":"closed"}',
  address              text not null default '',
  created_at           timestamptz not null default now()
);

create table if not exists shop_members (
  shop_id     text not null references shops(id) on delete cascade,
  user_id     text not null,
  role        text not null check (role in ('owner', 'employee')),
  employee_id text,
  created_at  timestamptz not null default now(),
  primary key (shop_id, user_id)
);

create table if not exists shop_billing (
  shop_id               text primary key references shops(id) on delete cascade,
  plan                  text not null default 'axiom_pro',
  status                text not null default 'trialing',
  price_cents           integer not null default 4900,
  gear_guardian_bps     integer not null default 150,
  updated_at            timestamptz not null default now()
);

create table if not exists employees (
  id               text primary key,
  shop_id          text not null references shops(id) on delete cascade,
  display_name     text not null,
  title            text not null default 'Specialist',
  bio              text not null default '',
  phone            text not null default '',
  avatar_url       text not null default '',
  invite_token     text unique,
  invite_status    text not null default 'pending' check (invite_status in ('pending', 'claimed')),
  claimed_user_id  text,
  created_at       timestamptz not null default now()
);

create table if not exists services (
  id            text primary key,
  shop_id       text not null references shops(id) on delete cascade,
  name          text not null,
  description   text not null default '',
  duration_min  integer not null default 30,
  price_cents   integer not null default 0,
  sort_order    integer not null default 0
);

create table if not exists employee_services (
  employee_id text not null references employees(id) on delete cascade,
  service_id  text not null references services(id) on delete cascade,
  primary key (employee_id, service_id)
);

create table if not exists appointments (
  id              text primary key,
  shop_id         text not null references shops(id) on delete cascade,
  employee_id     text not null references employees(id) on delete restrict,
  service_id      text not null references services(id) on delete restrict,
  customer_name   text not null,
  customer_phone  text not null default '',
  starts_at       timestamptz not null,
  status          text not null default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  payment_status  text not null default 'paid' check (payment_status in ('processing', 'paid', 'failed')),
  payment_ref     text,
  payment_cents   integer not null default 0,
  created_at      timestamptz not null default now()
);

create table if not exists portfolio_items (
  id           text primary key,
  shop_id      text not null references shops(id) on delete cascade,
  employee_id  text not null references employees(id) on delete cascade,
  image_url    text not null,
  caption      text not null default '',
  created_at   timestamptz not null default now()
);

create table if not exists shop_events (
  id              text primary key,
  shop_id         text not null references shops(id) on delete cascade,
  type            text not null,
  appointment_id  text,
  created_at      timestamptz not null default now()
);

create index if not exists shops_owner_idx on shops (owner_user_id);
create index if not exists employees_shop_idx on employees (shop_id);
create index if not exists employees_token_idx on employees (invite_token);
create index if not exists services_shop_idx on services (shop_id);
create index if not exists appointments_shop_idx on appointments (shop_id, starts_at);
create index if not exists appointments_emp_idx on appointments (employee_id, starts_at);
create unique index if not exists appointments_no_double_booking
  on appointments (employee_id, starts_at)
  where status in ('pending', 'confirmed');
create index if not exists portfolio_emp_idx on portfolio_items (employee_id);
create index if not exists shop_events_shop_idx on shop_events (shop_id, created_at);
create index if not exists shop_members_user_idx on shop_members (user_id);

create or replace function app_current_user_id() returns text
language sql stable as $$
  select nullif(current_setting('app.user_id', true), '')
$$;

create or replace function is_shop_member(_shop_id text) returns boolean
language sql stable as $$
  select exists (
    select 1 from shop_members
    where shop_id = _shop_id and user_id = app_current_user_id()
  )
$$;

create or replace function is_shop_owner(_shop_id text) returns boolean
language sql stable as $$
  select exists (
    select 1 from shops
    where id = _shop_id and owner_user_id = app_current_user_id()
  )
$$;

alter table shops enable row level security;
alter table shop_members enable row level security;
alter table shop_billing enable row level security;
alter table employees enable row level security;
alter table services enable row level security;
alter table employee_services enable row level security;
alter table appointments enable row level security;
alter table portfolio_items enable row level security;
alter table shop_events enable row level security;

drop policy if exists shops_public_read on shops;
create policy shops_public_read on shops
  for select using (true);

drop policy if exists shops_owner_write on shops;
create policy shops_owner_write on shops
  for all using (owner_user_id = app_current_user_id())
  with check (owner_user_id = app_current_user_id());

drop policy if exists members_self_read on shop_members;
create policy members_self_read on shop_members
  for select using (user_id = app_current_user_id() or is_shop_owner(shop_id));

drop policy if exists members_owner_write on shop_members;
create policy members_owner_write on shop_members
  for all using (is_shop_owner(shop_id))
  with check (is_shop_owner(shop_id));

drop policy if exists billing_owner_only on shop_billing;
create policy billing_owner_only on shop_billing
  for all using (is_shop_owner(shop_id))
  with check (is_shop_owner(shop_id));

drop policy if exists employees_public_read on employees;
create policy employees_public_read on employees
  for select using (true);

drop policy if exists employees_member_write on employees;
create policy employees_member_write on employees
  for all using (is_shop_member(shop_id) or is_shop_owner(shop_id))
  with check (is_shop_member(shop_id) or is_shop_owner(shop_id));

drop policy if exists services_public_read on services;
create policy services_public_read on services
  for select using (true);

drop policy if exists services_owner_write on services;
create policy services_owner_write on services
  for all using (is_shop_owner(shop_id))
  with check (is_shop_owner(shop_id));

drop policy if exists employee_services_public_read on employee_services;
create policy employee_services_public_read on employee_services
  for select using (true);

drop policy if exists employee_services_owner_write on employee_services;
create policy employee_services_owner_write on employee_services
  for all using (
    exists (select 1 from services s where s.id = service_id and is_shop_owner(s.shop_id))
  )
  with check (
    exists (select 1 from services s where s.id = service_id and is_shop_owner(s.shop_id))
  );

drop policy if exists appointments_member_read on appointments;
create policy appointments_member_read on appointments
  for select using (is_shop_member(shop_id) or is_shop_owner(shop_id));

drop policy if exists appointments_public_insert on appointments;
create policy appointments_public_insert on appointments
  for insert with check (true);

drop policy if exists appointments_member_update on appointments;
create policy appointments_member_update on appointments
  for update using (is_shop_member(shop_id) or is_shop_owner(shop_id));

drop policy if exists portfolio_public_read on portfolio_items;
create policy portfolio_public_read on portfolio_items
  for select using (true);

drop policy if exists portfolio_member_write on portfolio_items;
create policy portfolio_member_write on portfolio_items
  for all using (is_shop_member(shop_id) or is_shop_owner(shop_id))
  with check (is_shop_member(shop_id) or is_shop_owner(shop_id));

drop policy if exists events_public_read on shop_events;
create policy events_public_read on shop_events
  for select using (true);

drop policy if exists events_public_insert on shop_events;
create policy events_public_insert on shop_events
  for insert with check (true);
