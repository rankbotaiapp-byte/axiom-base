-- Conversation memory for Twilio inbound → Grok qualify → auto-book.
create table if not exists sms_inbound_turns (
  id         text primary key,
  from_e164  text not null,
  lead_slug  text not null default '',
  shop_id    text,
  role       text not null check (role in ('user', 'assistant')),
  body       text not null,
  created_at timestamptz not null default now()
);

create index if not exists sms_inbound_turns_from_idx
  on sms_inbound_turns (from_e164, created_at desc);

alter table sms_inbound_turns enable row level security;
