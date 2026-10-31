-- Owner toggle: Autopilot spends locked Brand DNA + shop_ai_credits on hero stills and loops.

alter table if exists shops
  add column if not exists ai_content_autopilot boolean not null default false;
