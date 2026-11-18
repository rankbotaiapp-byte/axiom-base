-- Studio trial credit pool. Safe when several Next.js build workers apply it at once.
-- The advisory lock is held until the migration transaction commits, so the
-- second worker waits, then sees the table and takes the IF NOT EXISTS path.

select pg_advisory_xact_lock(hashtext('public.studio_trial_credits')::bigint);

do $$
begin
  create table if not exists public.studio_trial_credits (
    id uuid primary key default gen_random_uuid(),
    tenant_slug text not null unique,
    credits_remaining int default 50,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
  );
exception
  when duplicate_table then null;
  when duplicate_object then null;
  when unique_violation then null;
end $$;
