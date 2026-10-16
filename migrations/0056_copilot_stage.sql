-- Staging and confirmed brand memory for the design partner.
-- Does not alter preloaded_leads. Staged heroes are not the public hero.

alter table shop_copilot_memory
  add column if not exists confirmed_colors text not null default '[]';

alter table shop_copilot_memory
  add column if not exists aesthetic_preferences text not null default '';

alter table shop_copilot_memory
  add column if not exists staged_hero_url text not null default '';

alter table shop_copilot_memory
  add column if not exists staged_hero_medium text not null default '';

alter table shop_copilot_memory
  add column if not exists staged_hero_prompt text not null default '';
