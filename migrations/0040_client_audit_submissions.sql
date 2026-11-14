-- Consumer audit requests for a shop. The shop is the tenant.
-- Server connections bypass RLS. These policies cover a restricted role:
-- a visitor may file an audit for a real shop, and only that shop's
-- owner or members can read it.

create table if not exists client_audit_submissions (
  id                         uuid primary key default gen_random_uuid(),
  tenant_id                  text not null references shops(id) on delete cascade,
  consumer_name              text not null,
  consumer_contact           text not null,
  property_or_project_details jsonb not null default '{}'::jsonb,
  audit_score                integer not null check (audit_score between 0 and 100),
  created_at                 timestamptz not null default now()
);

create index if not exists client_audit_submissions_tenant_idx
  on client_audit_submissions (tenant_id, created_at desc);

alter table client_audit_submissions enable row level security;

drop policy if exists client_audit_submissions_member_read on client_audit_submissions;
create policy client_audit_submissions_member_read on client_audit_submissions
  for select using (is_shop_owner(tenant_id) or is_shop_member(tenant_id));

drop policy if exists client_audit_submissions_owner_update on client_audit_submissions;
create policy client_audit_submissions_owner_update on client_audit_submissions
  for update using (is_shop_owner(tenant_id))
  with check (is_shop_owner(tenant_id));

drop policy if exists client_audit_submissions_owner_delete on client_audit_submissions;
create policy client_audit_submissions_owner_delete on client_audit_submissions
  for delete using (is_shop_owner(tenant_id));

drop policy if exists client_audit_submissions_public_insert on client_audit_submissions;
create policy client_audit_submissions_public_insert on client_audit_submissions
  for insert with check (exists (select 1 from shops where shops.id = tenant_id));
