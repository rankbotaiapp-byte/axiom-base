-- Evolve earlier quota tables (uuid user_id / plan_key / jsonb rpc) to the canonical schema.

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'tenant_generation_quotas'
  ) then
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'tenant_generation_quotas'
        and column_name = 'user_id'
        and udt_name = 'uuid'
    ) then
      alter table public.tenant_generation_quotas
        alter column user_id type text using user_id::text;
    end if;

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'tenant_generation_quotas'
        and column_name = 'plan_key'
    ) and not exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'tenant_generation_quotas'
        and column_name = 'plan_tier'
    ) then
      alter table public.tenant_generation_quotas
        rename column plan_key to plan_tier;
    end if;

    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'tenant_generation_quotas'
        and column_name = 'plan_tier'
    ) then
      alter table public.tenant_generation_quotas
        add column plan_tier text not null default 'none';
    end if;

    alter table public.tenant_generation_quotas
      alter column plan_tier set default 'none';

    update public.tenant_generation_quotas
       set plan_tier = 'none'
     where plan_tier is null or btrim(plan_tier) = '';

    alter table public.tenant_generation_quotas
      drop column if exists stripe_customer_id;

    alter table public.tenant_generation_quotas
      drop constraint if exists tenant_generation_quotas_plan_key_check;

    alter table public.tenant_generation_quotas
      drop constraint if exists tenant_generation_quotas_stripe_status_check;
  end if;
exception
  when undefined_table then null;
end $$;

drop policy if exists "Users can view own generation quota" on public.tenant_generation_quotas;
drop policy if exists tenant_generation_quotas_select_own on public.tenant_generation_quotas;
create policy "Users can view own generation quota"
  on public.tenant_generation_quotas
  for select
  using (auth.uid()::text = user_id);

drop function if exists public.consume_generation_credit(uuid);
drop function if exists public.consume_generation_credit(text);

create or replace function public.consume_generation_credit(p_user_id text)
returns table (allowed boolean, remaining integer, reason text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quota public.tenant_generation_quotas%rowtype;
begin
  select * into v_quota
  from public.tenant_generation_quotas
  where user_id = p_user_id
  for update;

  if not found or v_quota.stripe_status not in ('trialing', 'active', 'lifetime') then
    return query select false, 0, 'ACTIVE_TRIAL_REQUIRED';
    return;
  end if;

  if v_quota.generations_used >= v_quota.generation_limit then
    return query select false, 0, 'QUOTA_EXCEEDED';
    return;
  end if;

  update public.tenant_generation_quotas
  set generations_used = generations_used + 1,
      updated_at = now()
  where user_id = p_user_id;

  return query select true, (v_quota.generation_limit - (v_quota.generations_used + 1)), 'OK';
end;
$$;

create or replace function public.consume_generation_credit(p_user_id uuid)
returns table (allowed boolean, remaining integer, reason text)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query select * from public.consume_generation_credit(p_user_id::text);
end;
$$;

create or replace function public.refund_generation_credit(p_user_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.tenant_generation_quotas
  set generations_used = greatest(0, generations_used - 1),
      updated_at = now()
  where user_id = p_user_id;
end;
$$;

create or replace function public.refund_generation_credit(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refund_generation_credit(p_user_id::text);
end;
$$;

revoke all on function public.consume_generation_credit(text) from public;
revoke all on function public.consume_generation_credit(uuid) from public;
revoke all on function public.refund_generation_credit(text) from public;
revoke all on function public.refund_generation_credit(uuid) from public;
grant execute on function public.consume_generation_credit(text) to service_role;
grant execute on function public.consume_generation_credit(uuid) to service_role;
grant execute on function public.refund_generation_credit(text) to service_role;
grant execute on function public.refund_generation_credit(uuid) to service_role;