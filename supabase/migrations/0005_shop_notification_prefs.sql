-- Client-controlled lead alert destinations (Neon shops: migrations/0088).
alter table public.tenants add column if not exists notify_sms_enabled boolean not null default true;
alter table public.tenants add column if not exists notification_phone text;
alter table public.tenants add column if not exists notify_email_enabled boolean not null default true;
alter table public.tenants add column if not exists notification_email text;

update public.tenants
set notification_phone = phone
where coalesce(notification_phone, '') = ''
  and coalesce(phone, '') <> '';

update public.tenants
set notification_email = email
where coalesce(notification_email, '') = ''
  and coalesce(email, '') <> '';
