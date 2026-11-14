-- Cinematic Hero Studio jobs: one published look per shop, history retained.
create table if not exists hero_studio_jobs (
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
  on hero_studio_jobs (shop_slug, created_at desc);
