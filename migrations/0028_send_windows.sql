-- Smart timing remembers whether a batch trickles on weekday hours
-- or waits for a niche window. Existing rows stay on the weekday window.

alter table outreach_dispatches add column if not exists timing text not null default 'immediate';
alter table outreach_dispatches add column if not exists profile text not null default 'general';

alter table outreach_sequences add column if not exists timing text not null default 'immediate';
