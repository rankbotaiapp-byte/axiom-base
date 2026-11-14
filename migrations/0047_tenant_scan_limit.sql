-- Monthly scan allowance on the tenant that owns a shop.
-- A new month starts the count over. Shops with no tenant row are not capped.

alter table public.tenants
  add column if not exists scraping_limit integer not null default 500;

alter table public.tenants
  add column if not exists leads_used_this_month integer not null default 0;

alter table public.tenants
  add column if not exists usage_month date not null default (date_trunc('month', current_date)::date);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'tenants_scraping_limit_check' and conrelid = 'public.tenants'::regclass
  ) then
    alter table public.tenants
      add constraint tenants_scraping_limit_check check (scraping_limit >= 0);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'tenants_leads_used_check' and conrelid = 'public.tenants'::regclass
  ) then
    alter table public.tenants
      add constraint tenants_leads_used_check check (leads_used_this_month >= 0);
  end if;
end $$;

-- How many new leads this scan may add. Raises when the month is already full.
create or replace function public.scan_lead_allowance(target_shop text, want integer)
returns integer
language plpgsql
as $$
declare
  lim integer;
  used integer;
  month date;
  remaining integer;
begin
  if want is null or want < 1 then
    return 0;
  end if;

  select scraping_limit, leads_used_this_month, usage_month
    into lim, used, month
  from public.tenants
  where shop_id = target_shop
  for update;

  if not found then
    return want;
  end if;

  if month is distinct from date_trunc('month', current_date)::date then
    used := 0;
  end if;

  if coalesce(used, 0) >= coalesce(lim, 0) then
    raise exception 'This month''s scan limit is reached';
  end if;

  remaining := lim - used;
  if remaining < want then
    return remaining;
  end if;
  return want;
end;
$$;
