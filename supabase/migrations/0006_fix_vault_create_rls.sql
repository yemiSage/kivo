-- Creating a vault failed with an RLS error: INSERT ... RETURNING also checks the SELECT policy,
-- and can_access_vault() (a STABLE function) can't see the row being inserted. Let owners read their
-- own vaults directly, without going through the function.
drop policy if exists "vaults: members read" on public.collections;
create policy "vaults: members read" on public.collections for select using (
  user_id = auth.uid() or public.can_access_vault(id)
);
