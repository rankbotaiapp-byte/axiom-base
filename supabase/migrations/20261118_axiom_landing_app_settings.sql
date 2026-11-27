-- Axiom 3D landing config lives in public.app_settings.
-- The table itself is created by migrations/0099_app_settings.sql
-- (supabase/migrations/0101_app_settings.sql). This file only adds the
-- landing read policy and the realtime publication once the table exists.
-- setting_key = 'axiom_landing:<slug>', settings / setting_value = JSON.

-- 1. One row per key. No-op until 0101_app_settings.sql has created the table.
do $$
begin
  if to_regclass('public.app_settings') is null then
    raise notice 'public.app_settings missing; apply 0101_app_settings.sql';
    return;
  end if;
  execute 'create unique index if not exists app_settings_setting_key_uidx on public.app_settings (setting_key)';
  execute 'drop policy if exists "axiom landing public read" on public.app_settings';
  execute $policy$
    create policy "axiom landing public read"
      on public.app_settings
      for select
      using (setting_key like 'axiom_landing:%')
  $policy$;
end $$;

-- 3. Optional: live updates on other devices when the studio saves.
--    Safe to re-run: ignore if already a member of the publication.
do $$
begin
  alter publication supabase_realtime add table public.app_settings;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
