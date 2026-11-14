-- Admin-editable storefront templates (e.g. the Emergency Plumbing demo).
-- One JSON document per slug; the app sanitizes it on every read and write.

create table if not exists storefront_configs (
  slug text primary key,
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
