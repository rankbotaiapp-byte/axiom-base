-- Axiom Studio FX + global library.
-- Create the table, grants, RLS, and reload PostgREST with:
--   migrations/0099_app_settings.sql
--   node --env-file=.env.local scripts/reload-postgrest-schema.mjs --apply
--
-- The block below only adds the studio read policy once that table exists.

do $$
begin
  if to_regclass('public.app_settings') is null then
    raise notice 'public.app_settings missing; apply migrations/0099_app_settings.sql';
    return;
  end if;
  execute 'create unique index if not exists app_settings_setting_key_uidx on public.app_settings (setting_key)';
  execute 'drop policy if exists "axiom studio fx public read" on public.app_settings';
  execute $policy$
    create policy "axiom studio fx public read"
      on public.app_settings
      for select
      using (
        setting_key like 'axiom_studio_fx:%'
        or setting_key = 'axiom_studio_global'
      )
  $policy$;
end $$;
