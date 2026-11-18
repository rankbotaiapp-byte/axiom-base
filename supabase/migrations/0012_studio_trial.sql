alter table if exists public.tenants add column if not exists is_active boolean not null default false;
alter table if exists public.tenants add column if not exists ai_credits integer not null default 0;
