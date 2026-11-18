-- Tenant storefront niche customization metadata + dealer RLS update policy.
-- Dealers may only patch their own tenant row (owner_email / email match).

alter table if exists public.tenants
  add column if not exists storefront_metadata jsonb not null default '{}'::jsonb;

alter table if exists public.tenants
  add column if not exists owner_email text;

alter table if exists public.tenants
  add column if not exists owner_user_id uuid;

create index if not exists tenants_owner_email_idx
  on public.tenants (lower(owner_email));

alter table public.tenants enable row level security;

-- Public may read active / trialing storefronts (if not already present).
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'tenants' and policyname = 'public read live tenants storefront'
  ) then
    create policy "public read live tenants storefront"
      on public.tenants
      for select
      using (status in ('trialing', 'active', 'pending_review'));
  end if;
end $$;

-- Authenticated dealers update only their own tenant assets / metadata.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'tenants' and policyname = 'dealers update own storefront'
  ) then
    create policy "dealers update own storefront"
      on public.tenants
      for update
      using (
        auth.role() = 'authenticated'
        and (
          (owner_user_id is not null and owner_user_id = auth.uid())
          or (
            coalesce(owner_email, email) is not null
            and lower(coalesce(owner_email, email)) = lower(coalesce(auth.jwt() ->> 'email', ''))
          )
        )
      )
      with check (
        auth.role() = 'authenticated'
        and (
          (owner_user_id is not null and owner_user_id = auth.uid())
          or (
            coalesce(owner_email, email) is not null
            and lower(coalesce(owner_email, email)) = lower(coalesce(auth.jwt() ->> 'email', ''))
          )
        )
      );
  end if;
end $$;
