-- Perimeter HUD for a shop film. The app role still bypasses RLS.
-- No policies: the public data API cannot read or write these rows.

create table if not exists shop_hero_config (
  shop_id text primary key,
  config text not null default '{}',
  updated_at timestamptz not null default now()
);

alter table if exists shop_hero_config enable row level security;
