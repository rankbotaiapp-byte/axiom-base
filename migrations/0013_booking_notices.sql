-- Employee station notices, guest contact email, and an accept confirmation kind.

alter table appointments add column if not exists customer_email text not null default '';

alter table shop_notifications add column if not exists employee_id text;

do $$
begin
  alter table shop_notifications
    add constraint shop_notifications_employee_fk
    foreign key (employee_id) references employees(id) on delete cascade;
exception
  when duplicate_object then null;
end $$;

do $$
declare r record;
begin
  for r in
    select conname from pg_constraint
    where conrelid = 'shop_notifications'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%kind%'
  loop
    execute format('alter table shop_notifications drop constraint %I', r.conname);
  end loop;
end $$;

alter table shop_notifications drop constraint if exists shop_notifications_kind_check;
alter table shop_notifications add constraint shop_notifications_kind_check
  check (kind in ('booking_request', 'booking_paid', 'inquiry', 'booking_confirmed'));

create index if not exists shop_notifications_employee_idx
  on shop_notifications (employee_id, created_at desc);
