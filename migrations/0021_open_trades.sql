-- Open trade categories. Built-in niches keep their id. Any other
-- directory category is stored as its own key plus the label operators typed.

alter table preloaded_leads add column if not exists trade_label text not null default '';
