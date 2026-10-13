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
    ), 0)::bigint from storage.objects where bucket_id = 'media');
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
    from storage.objects o
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
