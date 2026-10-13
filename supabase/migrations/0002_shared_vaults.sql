-- Shared vaults: collaborative access, invite links, and server-side vault counts.

create table public.vault_memberships (
  vault_id uuid not null references public.collections(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (vault_id, user_id)
);

create table public.vault_invites (
  id uuid primary key default gen_random_uuid(),
  vault_id uuid not null references public.collections(id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  invited_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index vault_memberships_user_idx on public.vault_memberships(user_id, joined_at);
create index vault_invites_token_idx on public.vault_invites(token) where accepted_at is null;

create or replace function public.can_access_vault(vault uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.collections c where c.id = vault and c.user_id = auth.uid()
  ) or exists (
    select 1 from public.vault_memberships m where m.vault_id = vault and m.user_id = auth.uid()
  );
$$;

revoke all on function public.can_access_vault(uuid) from public;
grant execute on function public.can_access_vault(uuid) to authenticated;

alter table public.vault_memberships enable row level security;
alter table public.vault_invites enable row level security;

drop policy if exists "collections: owner all" on public.collections;
create policy "vaults: members read" on public.collections for select using (public.can_access_vault(id));
create policy "vaults: owner insert" on public.collections for insert with check (user_id = auth.uid());
create policy "vaults: owner update" on public.collections for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "vaults: owner delete" on public.collections for delete using (user_id = auth.uid());

create policy "memberships: members read" on public.vault_memberships for select using (public.can_access_vault(vault_id));
create policy "memberships: owner remove" on public.vault_memberships for delete using (
  exists (select 1 from public.collections c where c.id = vault_id and c.user_id = auth.uid()) or user_id = auth.uid()
);

create policy "invites: owner read" on public.vault_invites for select using (
  exists (select 1 from public.collections c where c.id = vault_id and c.user_id = auth.uid())
);
create policy "invites: owner create" on public.vault_invites for insert with check (
  invited_by = auth.uid() and exists (select 1 from public.collections c where c.id = vault_id and c.user_id = auth.uid())
);
create policy "invites: owner delete" on public.vault_invites for delete using (
  exists (select 1 from public.collections c where c.id = vault_id and c.user_id = auth.uid())
);

drop policy if exists "items: owner read" on public.items;
drop policy if exists "items: owner delete" on public.items;
drop policy if exists "items: owner insert" on public.items;
drop policy if exists "items: owner update" on public.items;

create policy "items: vault members read" on public.items for select using (
  user_id = auth.uid() or (collection_id is not null and public.can_access_vault(collection_id))
);
create policy "items: vault members delete" on public.items for delete using (
  user_id = auth.uid() or (collection_id is not null and public.can_access_vault(collection_id))
);
create policy "items: vault members insert" on public.items for insert with check (
  user_id = auth.uid()
  and (collection_id is null or public.can_access_vault(collection_id))
  and (storage_path is null or storage_path like auth.uid()::text || '/%')
);
create policy "items: vault members update" on public.items for update using (
  user_id = auth.uid() or (collection_id is not null and public.can_access_vault(collection_id))
) with check (
  collection_id is null or public.can_access_vault(collection_id)
);

create or replace function public.accept_vault_invite(invite_token uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare target_vault uuid;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  select vault_id into target_vault from public.vault_invites
   where token = invite_token and accepted_at is null and expires_at > now()
   for update;
  if target_vault is null then raise exception 'This invite is invalid or expired'; end if;
  insert into public.vault_memberships(vault_id, user_id)
  values (target_vault, auth.uid()) on conflict do nothing;
  update public.vault_invites set accepted_at = now(), accepted_by = auth.uid() where token = invite_token;
  return target_vault;
end $$;

grant execute on function public.accept_vault_invite(uuid) to authenticated;

create or replace function public.list_vaults_with_counts()
returns table(id uuid, user_id uuid, name text, emoji text, created_at timestamptz, item_count bigint, cover text)
language sql stable security invoker as $$
  select c.id, c.user_id, c.name, c.emoji, c.created_at,
         count(i.id) as item_count,
         (array_agg(i.thumbnail_url order by i.created_at desc) filter (where i.thumbnail_url is not null))[1] as cover
  from public.collections c
  left join public.items i on i.collection_id = c.id
  group by c.id
  order by c.created_at;
$$;

grant execute on function public.list_vaults_with_counts() to authenticated;

create or replace function public.search_items(q text, kind_filter public.item_kind default null, lim int default 60)
returns setof public.items
language sql stable security invoker as $$
  select i.* from public.items i
  where (i.user_id = auth.uid() or (i.collection_id is not null and public.can_access_vault(i.collection_id)))
    and (kind_filter is null or i.kind = kind_filter)
    and (
         i.search @@ websearch_to_tsquery('simple', q)
      or i.title ilike '%' || q || '%'
      or i.notes ilike '%' || q || '%'
      or i.url ilike '%' || q || '%'
      or exists (select 1 from unnest(i.tags) t where t ilike q || '%')
    )
  order by ts_rank(i.search, websearch_to_tsquery('simple', q)) desc, i.created_at desc
  limit least(greatest(lim, 1), 200);
$$;

drop policy if exists "media: owner read" on storage.objects;
create policy "media: owner or vault member read" on storage.objects for select using (
  bucket_id = 'media' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1 from public.items i
      where i.storage_path = name and i.collection_id is not null and public.can_access_vault(i.collection_id)
    )
  )
);
