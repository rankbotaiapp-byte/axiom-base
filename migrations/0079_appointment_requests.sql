-- Voice-desk booking asks. These are requests, not confirmed appointments:
-- they do not occupy a staff slot until an owner accepts them.

create table if not exists appointment_requests (
  id                 text primary key,
  consumer_lead_id   uuid references consumer_leads(id) on delete set null,
  shop_id            text references shops(id) on delete set null,
  caller_name        text not null default '',
  caller_phone       text not null default '',
  requested_service  text not null default '',
  transcript         text not null default '',
  vapi_call_id       text not null,
  status             text not null default 'new'
                     check (status in ('new', 'reviewed', 'booked', 'closed')),
  created_at         timestamptz not null default now()
);

create unique index if not exists appointment_requests_call_idx
  on appointment_requests (vapi_call_id);

create index if not exists appointment_requests_lead_idx
  on appointment_requests (consumer_lead_id, created_at desc);

alter table appointment_requests enable row level security;

drop policy if exists appointment_requests_owner_read on appointment_requests;
create policy appointment_requests_owner_read on appointment_requests
  for select using (
    shop_id is not null and is_shop_owner(shop_id)
  );
