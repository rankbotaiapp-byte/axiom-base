alter table shops add column if not exists notify_sms_enabled boolean not null default true;
alter table shops add column if not exists notification_phone text not null default '';
alter table shops add column if not exists notify_email_enabled boolean not null default true;
alter table shops add column if not exists notification_email text not null default '';

update shops
set notification_phone = notify_phone
where coalesce(notification_phone, '') = ''
  and coalesce(notify_phone, '') <> '';

update shops
set notification_email = notify_email
where coalesce(notification_email, '') = ''
  and coalesce(notify_email, '') <> '';
