-- Mirrors migrations/0094_hero_studio_jobs.sql for the Supabase project.
create table if not exists public.hero_studio_jobs (
  id text primary key,
  shop_id text not null,
  shop_slug text not null,
  owner_user_id text not null,
  mode text not null default 'manual',
  effect_id text not null,
  brand_mark text not null default 'frost',
  loop_url text not null default '',
  logo_url text not null default '',
  status text not null default 'ready',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hero_studio_jobs_shop_idx
  on public.hero_studio_jobs (shop_slug, created_at desc);

alter table public.hero_studio_jobs replica identity full;
