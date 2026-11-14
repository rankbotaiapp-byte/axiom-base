-- Desk-built outreach links, separate from the regional roster.

alter table preloaded_leads add column if not exists source text not null default '';

create index if not exists preloaded_leads_source_idx on preloaded_leads (source, created_at desc);
