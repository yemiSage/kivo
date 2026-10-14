-- Prevent shared-vault members from changing an item's owner or pointing it at
-- another user's private storage object through direct API calls.

create or replace function public.lock_item_security_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.user_id is distinct from old.user_id then
    raise exception 'Item owner cannot be changed';
  end if;
  if new.storage_path is distinct from old.storage_path then
    raise exception 'Item storage path cannot be changed';
  end if;
  return new;
end;
$$;

drop trigger if exists lock_item_security_fields on public.items;
create trigger lock_item_security_fields
  before update on public.items
  for each row execute function public.lock_item_security_fields();

drop policy if exists "items: vault members update" on public.items;
create policy "items: vault members update" on public.items for update using (
  user_id = auth.uid() or (collection_id is not null and public.can_access_vault(collection_id))
) with check (
  (user_id = auth.uid() or (collection_id is not null and public.can_access_vault(collection_id)))
  and (storage_path is null or storage_path like user_id::text || '/%')
);
