-- An item owner must also be allowed to access the destination vault.
-- Owners retain access to their own items, but cannot place them in an
-- unrelated user's vault by submitting its UUID through the database API.
begin;

drop policy if exists "items: vault members update" on public.items;
create policy "items: vault members update" on public.items
for update
using (
  user_id = auth.uid()
  or (collection_id is not null and public.can_access_vault(collection_id))
)
with check (
  (user_id = auth.uid() or (collection_id is not null and public.can_access_vault(collection_id)))
  and (collection_id is null or public.can_access_vault(collection_id))
  and (storage_path is null or storage_path like user_id::text || '/%')
);

commit;
