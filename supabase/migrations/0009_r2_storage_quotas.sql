-- Private R2 ledger. Only trusted server credentials may reserve or release bytes.
create table if not exists public.media_uploads (
  path text primary key,
  user_id uuid not null references auth.users(id),
  bytes bigint not null check (bytes > 0 and bytes <= 1048576),
  state text not null default 'pending' check (state in ('pending','ready','attached','delete_pending')),
  created_at timestamptz not null default now(),
  check (path like user_id::text || '/r2/%')
);
create index if not exists media_uploads_user_id on public.media_uploads(user_id);
alter table public.media_uploads enable row level security;
revoke all on public.media_uploads from anon, authenticated;
grant all on public.media_uploads to service_role;

create or replace function public.enforce_media_quota() returns trigger
language plpgsql security definer set search_path = '' as $$
declare used_bytes bigint; legacy_bytes bigint;
begin
  -- One transaction lock serializes reservations across users and app instances.
  perform pg_catalog.pg_advisory_xact_lock(7406143);
  select coalesce(sum(bytes),0) into used_bytes from public.media_uploads where user_id = new.user_id;
  select coalesce(sum(coalesce((metadata->>'size')::bigint,0)),0) into legacy_bytes
    from storage.objects where bucket_id = 'media' and split_part(name,'/',1) = new.user_id::text;
  if used_bytes + legacy_bytes + new.bytes > 104857600 then
    raise exception 'Your 100 MB storage allowance is full. Delete an image to free space.';
  end if;
  select coalesce(sum(bytes),0) into used_bytes from public.media_uploads;
  if used_bytes + new.bytes > 9000000000 then
    raise exception 'Storage is temporarily full. Please try again later.';
  end if;
  return new;
end; $$;
drop trigger if exists enforce_media_quota on public.media_uploads;
create trigger enforce_media_quota before insert on public.media_uploads
for each row execute function public.enforce_media_quota();

create or replace function public.attach_media_upload() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.storage_path is null then return new; end if;
  -- Reject new legacy uploads too: callers cannot bypass R2's ledger.
  update public.media_uploads set state = 'attached'
    where path = new.storage_path and user_id = new.user_id and state = 'ready';
  if not found then raise exception 'Invalid or already attached image upload'; end if;
  return new;
end; $$;
drop trigger if exists attach_media_upload on public.items;
create trigger attach_media_upload before insert on public.items
for each row execute function public.attach_media_upload();

create or replace function public.queue_media_deletion() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.media_uploads set state = 'delete_pending' where path = old.storage_path;
  return old;
end; $$;
drop trigger if exists queue_media_deletion on public.items;
create trigger queue_media_deletion after delete on public.items
for each row execute function public.queue_media_deletion();

-- Existing media remains readable/deletable, but new direct uploads are disabled.
drop policy if exists "media: owner insert" on storage.objects;
revoke all on function public.enforce_media_quota() from public;
revoke all on function public.attach_media_upload() from public;
revoke all on function public.queue_media_deletion() from public;

-- Include R2 reservations/objects in existing storage metrics.
-- Aggregate operational metrics for the server-only superadmin dashboard.
-- These functions are callable only with Supabase's service role.

create or replace function public.superadmin_overview()
returns table (
  total_users bigint,
  new_users_7d bigint,
  item_count bigint,
  upload_count bigint,
  storage_bytes bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select count(*) from auth.users),
    (select count(*) from auth.users where created_at >= now() - interval '7 days'),
    (select count(*) from public.items),
    (select count(*) from public.items where storage_path is not null),
    (select coalesce(sum(
      case when metadata->>'size' ~ '^[0-9]+$' then (metadata->>'size')::bigint else 0 end
    ), 0)::bigint from storage.objects where bucket_id = 'media')
      + (select coalesce(sum(bytes),0)::bigint from public.media_uploads);
$$;

create or replace function public.superadmin_user_metrics(
  search_term text default null,
  result_limit integer default 100,
  result_offset integer default 0
)
returns table (
  user_id uuid,
  email text,
  joined_at timestamptz,
  last_sign_in_at timestamptz,
  item_count bigint,
  upload_count bigint,
  collection_count bigint,
  storage_bytes bigint,
  last_saved_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  with item_stats as (
    select
      i.user_id,
      count(*)::bigint as item_count,
      count(*) filter (where i.storage_path is not null)::bigint as upload_count,
      max(i.created_at) as last_saved_at
    from public.items i
    group by i.user_id
  ), collection_stats as (
    select c.user_id, count(*)::bigint as collection_count
    from public.collections c
    group by c.user_id
  ), storage_stats as (
    select
      split_part(o.name, '/', 1) as folder_user_id,
      coalesce(sum(
        case when o.metadata->>'size' ~ '^[0-9]+$' then (o.metadata->>'size')::bigint else 0 end
      ), 0)::bigint as storage_bytes
    from (
      select name, metadata, bucket_id from storage.objects
      union all
      select path as name, jsonb_build_object('size',bytes) as metadata, 'media' as bucket_id from public.media_uploads
    ) o
    where o.bucket_id = 'media'
    group by split_part(o.name, '/', 1)
  )
  select
    u.id,
    u.email::text,
    u.created_at,
    u.last_sign_in_at,
    coalesce(i.item_count, 0),
    coalesce(i.upload_count, 0),
    coalesce(c.collection_count, 0),
    coalesce(s.storage_bytes, 0),
    i.last_saved_at
  from auth.users u
  left join item_stats i on i.user_id = u.id
  left join collection_stats c on c.user_id = u.id
  left join storage_stats s on s.folder_user_id = u.id::text
  where search_term is null or u.email ilike '%' || search_term || '%'
  order by coalesce(s.storage_bytes, 0) desc, u.created_at desc
  limit least(greatest(result_limit, 1), 500)
  offset greatest(result_offset, 0);
$$;

revoke all on function public.superadmin_overview() from public, anon, authenticated;
revoke all on function public.superadmin_user_metrics(text, integer, integer) from public, anon, authenticated;
grant execute on function public.superadmin_overview() to service_role;
grant execute on function public.superadmin_user_metrics(text, integer, integer) to service_role;
