-- Outreach studio unlock. One row per tenant slug, funded once by the $1 trial webhook.
-- Parallel Next.js build workers each open a transaction. The lock makes them
-- take turns; IF NOT EXISTS then no-ops for every worker after the first.

select pg_advisory_xact_lock(hashtext('public.studio_trial_credits')::bigint);

do $$
begin
  create table if not exists studio_trial_credits (
  slug text primary key,
  is_active boolean not null default false,
  credits integer not null default 0,
  trial_ends_at timestamptz,
  stripe_customer_id text not null default '',
  granted_event_id text not null default '',
  updated_at timestamptz not null default now()
  );
exception
  when duplicate_table then null;
  when duplicate_object then null;
  when unique_violation then null;
end $$;

do $$
begin
  create table if not exists studio_trial_events (
  event_id text primary key,
  slug text not null,
  created_at timestamptz not null default now()
  );
exception
  when duplicate_table then null;
  when duplicate_object then null;
  when unique_violation then null;
end $$;

alter table if exists tenants add column if not exists is_active boolean not null default false;
alter table if exists tenants add column if not exists ai_credits integer not null default 0;
