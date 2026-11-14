-- Better Auth owns public.user / session / account / verification.
-- Policies that key off auth.uid() hide every row from a role that does not
-- bypass RLS, so sign-in looks up an empty table and returns 401
-- ("User not found"). The server role writes these tables directly.
-- Row level security stays on with no policies, so the public data API
-- cannot read password hashes. The table owner still bypasses RLS.

drop policy if exists "Allow users to update own account" on public.account;
drop policy if exists "Allow users to view own account" on public.account;
drop policy if exists "Allow users to manage own sessions" on public.session;
drop policy if exists "Allow users to update own user record" on public."user";
drop policy if exists "Allow users to view own user record" on public."user";
