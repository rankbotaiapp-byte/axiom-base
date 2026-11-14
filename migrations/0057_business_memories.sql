-- Per-shop design memory. The live copilot reads and writes this table.
-- shop_copilot_memory is left in place. Rows are copied only when it exists.
-- Does not alter preloaded_leads, seeds, or payment tables.

create table if not exists business_memories (
  shop_id                 text primary key references shops(id) on delete cascade,
  brand_notes             text not null default '',
  niche                   text not null default '',
  preferred_accent        text not null default '',
  style_tokens            text not null default '{}',
  aesthetic_preferences   text not null default '',
  past_prompts            text not null default '[]',
  style_snapshots         text not null default '[]',
  owner_feedback          text not null default '',
  confirmed_colors        text not null default '[]',
  staged_hero_url         text not null default '',
  staged_hero_medium      text not null default '',
  staged_hero_prompt      text not null default '',
  updated_at              timestamptz not null default now()
);

do $$
begin
  if to_regclass('public.shop_copilot_memory') is null then
    return;
  end if;

  insert into business_memories (
    shop_id, brand_notes, niche, preferred_accent, style_tokens,
    aesthetic_preferences, past_prompts, style_snapshots, owner_feedback,
    confirmed_colors, staged_hero_url, staged_hero_medium, staged_hero_prompt, updated_at
  )
  select
    shop_id,
    brand_notes,
    niche,
    preferred_accent,
    case
      when coalesce(preferred_accent, '') <> '' then json_build_object('accent', preferred_accent)::text
      else '{}'
    end,
    coalesce(aesthetic_preferences, ''),
    coalesce(past_prompts, '[]'),
    coalesce(style_snapshots, '[]'),
    coalesce(owner_feedback, ''),
    coalesce(confirmed_colors, '[]'),
    coalesce(staged_hero_url, ''),
    coalesce(staged_hero_medium, ''),
    coalesce(staged_hero_prompt, ''),
    updated_at
  from shop_copilot_memory
  on conflict (shop_id) do nothing;
end $$;
