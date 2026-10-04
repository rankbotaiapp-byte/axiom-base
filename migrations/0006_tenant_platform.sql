-- Owner alerts, Stripe Connect destination accounts, and guest unpaid requests.
-- RLS still keys off app_current_user_id(); a Supabase port swaps that for auth.uid()::text.

alter table shops add column if not exists notify_email text not null default '';
alter table shops add column if not exists notify_phone text not null default '';

alter table shop_billing add column if not exists stripe_account_id text;
alter table shop_billing add column if not exists stripe_charges_enabled boolean not null default false;

do $$
declare r record;
begin
  for r in
    select conname from pg_constraint
    where conrelid = 'appointments'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%payment_status%'
  loop
    execute format('alter table appointments drop constraint %I', r.conname);
  end loop;
end $$;

alter table appointments add constraint appointments_payment_status_check
  check (payment_status in ('unpaid', 'processing', 'paid', 'failed'));

create table if not exists shop_notifications (
  id           text primary key,
  shop_id      text not null references shops(id) on delete cascade,
  channel      text not null check (channel in ('inbox', 'email', 'sms', 'webhook')),
  kind         text not null check (kind in ('booking_request', 'booking_paid', 'inquiry')),
  destination  text not null default '',
  subject      text not null default '',
  body         text not null default '',
  status       text not null default 'queued' check (status in ('queued', 'sent', 'skipped', 'failed')),
  detail       text not null default '',
  created_at   timestamptz not null default now()
);

create index if not exists shop_notifications_shop_idx
  on shop_notifications (shop_id, created_at desc);

alter table shop_notifications enable row level security;

drop policy if exists notifications_owner on shop_notifications;
create policy notifications_owner on shop_notifications
  for all using (is_shop_owner(shop_id))
  with check (is_shop_owner(shop_id));
