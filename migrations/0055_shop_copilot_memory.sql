-- Shop-scoped design-partner memory. Does not alter preloaded_leads.
-- Queries must filter by the shop id resolved from the signed-in owner.

create table if not exists shop_copilot_memory (
  shop_id          text primary key references shops(id) on delete cascade,
  brand_notes      text not null default '',
  niche            text not null default '',
  preferred_accent text not null default '',
  past_prompts     text not null default '[]',
  style_snapshots  text not null default '[]',
  owner_feedback   text not null default '',
  updated_at       timestamptz not null default now()
);
