-- Role used by the lead search. The signed-in user id is matched here.
-- Customers and missing rows are not allowed to read preloaded leads.
-- Shop membership stays in sync, and an admin role is not downgraded.

create table if not exists profiles (
  user_id    text primary key,
  role       text not null check (role in ('owner', 'employee', 'admin', 'platform_admin', 'customer')),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

create or replace function public.sync_profile_from_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (user_id, role)
  values (new.user_id, new.role)
  on conflict (user_id) do update
    set role = case
          when profiles.role in ('admin', 'platform_admin') then profiles.role
          when profiles.role = 'owner' or excluded.role = 'owner' then 'owner'
          else excluded.role
        end,
        updated_at = now();
  return new;
end;
$$;

create or replace function public.drop_profile_without_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from profiles
  where user_id = old.user_id
    and role in ('owner', 'employee')
    and not exists (
      select 1 from shop_members m where m.user_id = old.user_id
    );
  return old;
end;
$$;

drop trigger if exists shop_members_profile_sync on shop_members;
create trigger shop_members_profile_sync
  after insert or update of role on shop_members
  for each row execute function public.sync_profile_from_member();

drop trigger if exists shop_members_profile_drop on shop_members;
create trigger shop_members_profile_drop
  after delete on shop_members
  for each row execute function public.drop_profile_without_membership();

insert into profiles (user_id, role)
select user_id, role
from shop_members
where role in ('owner', 'employee')
on conflict (user_id) do update
  set role = case
        when profiles.role in ('admin', 'platform_admin') then profiles.role
        when profiles.role = 'owner' or excluded.role = 'owner' then 'owner'
        else excluded.role
      end,
      updated_at = now();

insert into profiles (user_id, role)
select owner_user_id, 'owner'
from shops
where owner_user_id is not null
  and btrim(owner_user_id) <> ''
on conflict (user_id) do update
  set role = case
        when profiles.role in ('admin', 'platform_admin') then profiles.role
        else 'owner'
      end,
      updated_at = now();
