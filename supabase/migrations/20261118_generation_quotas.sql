-- Per-user AI generation entitlements (Stripe-backed). Service role upserts; users read their row.

create table if not exists public.tenant_generation_quotas (
  user_id text primary key,
  plan_tier text not null default 'none' check (plan_tier in ('none', 'trial_1', 'pro_150', 'founder_lifetime')),
  stripe_status text not null default 'inactive',
  generations_used integer not null default 0,
  generation_limit integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.tenant_generation_quotas enable row level security;

drop policy if exists "Users can view own generation quota" on public.tenant_generation_quotas;
drop policy if exists tenant_generation_quotas_select_own on public.tenant_generation_quotas;
create policy "Users can view own generation quota"
  on public.tenant_generation_quotas
  for select
  using (auth.uid()::text = user_id);

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