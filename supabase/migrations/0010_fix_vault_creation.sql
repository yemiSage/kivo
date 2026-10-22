-- INSERT ... RETURNING also checks the SELECT policy. The stable access helper
-- cannot see a vault inserted by the current statement, so check its owner
-- directly on the new row before checking shared access.
-- Preserve the installed shared-access expression and roles: some deployments
-- have moved can_access_vault into the private schema as a security hardening.
do $$
declare
  existing_qual text;
begin
  select qual into existing_qual from pg_policies
    where schemaname = 'public' and tablename = 'collections'
      and policyname = 'vaults: members read' and cmd = 'SELECT';
  if existing_qual is null then
    raise exception 'Missing vault read policy. Apply the shared-vault migration first.';
  end if;
  execute format(
    'alter policy %I on public.collections using (user_id = auth.uid() or (%s))',
    'vaults: members read', existing_qual
  );
end $$;
