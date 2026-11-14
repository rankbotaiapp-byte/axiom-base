-- An estimate can be confirmed back to the customer who requested it.

alter table lead_audits add column if not exists status text not null default 'open';
