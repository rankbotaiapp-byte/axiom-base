-- The site address from a bulk import. has_website stays the yes/no flag.

alter table preloaded_leads add column if not exists website text not null default '';
