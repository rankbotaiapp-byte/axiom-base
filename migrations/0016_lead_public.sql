-- Public listing details the outreach hooks can quote.

alter table preloaded_leads add column if not exists contact_name text not null default '';
alter table preloaded_leads add column if not exists review_score numeric;
alter table preloaded_leads add column if not exists review_count integer;
alter table preloaded_leads add column if not exists has_website boolean;
alter table preloaded_leads add column if not exists phone_line text not null default '';
