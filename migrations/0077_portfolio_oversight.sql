-- Staff proof-of-work: status, feature flag, order, tags.
-- Public read is approved work only. Staff write their own employee_id. Owners moderate all.

alter table if exists portfolio_items
  add column if not exists status text not null default 'approved';
alter table if exists portfolio_items
  add column if not exists featured boolean not null default false;
alter table if exists portfolio_items
  add column if not exists sort_order integer not null default 0;
alter table if exists portfolio_items
  add column if not exists tags text not null default '';

update portfolio_items set status = 'approved' where status is null or btrim(status) = '';

create or replace function is_staff_profile(_employee_id text) returns boolean
language sql stable as $$
  select exists (
    select 1 from employees e
    where e.id = _employee_id
      and (
        e.claimed_user_id = app_current_user_id()
        or exists (
          select 1 from shop_members m
          where m.shop_id = e.shop_id
            and m.user_id = app_current_user_id()
            and m.employee_id = e.id
            and m.role = 'employee'
        )
      )
  )
$$;

alter table portfolio_items enable row level security;

drop policy if exists portfolio_public_read on portfolio_items;
create policy portfolio_public_read on portfolio_items
  for select using (status = 'approved' or is_shop_owner(shop_id) or is_staff_profile(employee_id));

drop policy if exists portfolio_member_write on portfolio_items;
drop policy if exists portfolio_staff_write on portfolio_items;
create policy portfolio_staff_write on portfolio_items
  for all using (is_staff_profile(employee_id))
  with check (is_staff_profile(employee_id));

drop policy if exists portfolio_owner_write on portfolio_items;
create policy portfolio_owner_write on portfolio_items
  for all using (is_shop_owner(shop_id))
  with check (is_shop_owner(shop_id));
