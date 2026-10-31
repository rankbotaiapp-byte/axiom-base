-- Partial geo indexes for unclaimed active leads.
-- No-op when `active` is not on the table yet. Local boot may skip this file
-- on statement_timeout; queries still resolve without the indexes.

do $$
begin
  if to_regclass('public.preloaded_leads') is null then
    return;
  end if;
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'preloaded_leads'
      and column_name = 'active'
  ) then
    return;
  end if;

  execute $idx$
    create index if not exists preloaded_leads_state_county_niche_idx
      on preloaded_leads (state, lower(county), niche)
      where active and not claimed
  $idx$;
  execute $idx$
    create index if not exists preloaded_leads_zip_code_idx
      on preloaded_leads (zip_code)
      where active and not claimed
  $idx$;
  execute $idx$
    create index if not exists preloaded_leads_niche_active_idx
      on preloaded_leads (niche, created_at desc)
      where active and not claimed
  $idx$;
exception
  when undefined_column then null;
  when undefined_table then null;
end $$;
