-- Storage controls only: these settings do not grant administrator privileges.
create table if not exists public.platform_storage_settings (
  id integer primary key default 1 check (id = 1),
  uploads_enabled boolean not null default true,
  default_user_quota_bytes bigint not null default 104857600 check (default_user_quota_bytes between 1048576 and 104857600),
  total_quota_bytes bigint not null default 9000000000 check (total_quota_bytes between 1000000000 and 9000000000),
  updated_at timestamptz not null default now()
);
insert into public.platform_storage_settings(id) values (1) on conflict do nothing;
create table if not exists public.user_storage_controls (
  user_id uuid primary key references auth.users(id) on delete cascade,
  quota_bytes bigint check (quota_bytes between 1048576 and 104857600),
  uploads_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);
create table if not exists public.admin_storage_audit (
  id bigint generated always as identity primary key,
  actor_id uuid not null,
  target_user_id uuid,
  action text not null,
  before_value jsonb,
  after_value jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.platform_storage_settings enable row level security;
alter table public.user_storage_controls enable row level security;
alter table public.admin_storage_audit enable row level security;
revoke all on public.platform_storage_settings, public.user_storage_controls, public.admin_storage_audit from anon, authenticated;
grant select on public.platform_storage_settings to authenticated;
drop policy if exists "storage settings: signed-in read" on public.platform_storage_settings;
create policy "storage settings: signed-in read" on public.platform_storage_settings for select to authenticated using (true);
grant all on public.platform_storage_settings, public.user_storage_controls, public.admin_storage_audit to service_role;
grant usage, select on sequence public.admin_storage_audit_id_seq to service_role;

create or replace function public.enforce_media_quota() returns trigger
language plpgsql security definer set search_path = '' as $$
declare used_bytes bigint; legacy_bytes bigint; quota bigint; enabled boolean; cfg public.platform_storage_settings;
begin
  perform pg_catalog.pg_advisory_xact_lock(7406143);
  select * into strict cfg from public.platform_storage_settings where id = 1;
  select coalesce(quota_bytes,cfg.default_user_quota_bytes), uploads_enabled into quota, enabled
    from public.user_storage_controls where user_id = new.user_id;
  quota := coalesce(quota,cfg.default_user_quota_bytes);
  if not cfg.uploads_enabled or enabled = false then raise exception 'Image uploads are currently paused.'; end if;
  select coalesce(sum(bytes),0) into used_bytes from public.media_uploads where user_id = new.user_id;
  select coalesce(sum(case when metadata->>'size' ~ '^[0-9]+$' then (metadata->>'size')::bigint else 0 end),0) into legacy_bytes
    from storage.objects where bucket_id = 'media' and split_part(name,'/',1) = new.user_id::text;
  if used_bytes + legacy_bytes + new.bytes > quota then raise exception 'Your storage allowance is full. Delete an image to free space.'; end if;
  select coalesce(sum(bytes),0) into used_bytes from public.media_uploads;
  if used_bytes + new.bytes > cfg.total_quota_bytes then raise exception 'Storage is temporarily full. Please try again later.'; end if;
  return new;
end; $$;

create or replace function public.admin_save_platform_storage(p_actor uuid, p_enabled boolean, p_user_quota bigint, p_total_quota bigint)
returns void language plpgsql security definer set search_path = '' as $$
declare before_row jsonb; after_row jsonb;
begin
  perform pg_catalog.pg_advisory_xact_lock(7406143);
  select to_jsonb(s) into before_row from public.platform_storage_settings s where id=1;
  update public.platform_storage_settings set uploads_enabled=p_enabled, default_user_quota_bytes=p_user_quota, total_quota_bytes=p_total_quota, updated_at=now() where id=1;
  select to_jsonb(s) into after_row from public.platform_storage_settings s where id=1;
  insert into public.admin_storage_audit(actor_id,action,before_value,after_value) values(p_actor,'platform_storage',before_row,after_row);
end; $$;

create or replace function public.admin_save_user_storage(p_actor uuid, p_user uuid, p_enabled boolean, p_quota bigint)
returns void language plpgsql security definer set search_path = '' as $$
declare before_row jsonb; after_row jsonb;
begin
  perform pg_catalog.pg_advisory_xact_lock(7406143);
  select to_jsonb(s) into before_row from public.user_storage_controls s where user_id=p_user;
  insert into public.user_storage_controls(user_id,uploads_enabled,quota_bytes) values(p_user,p_enabled,p_quota)
    on conflict(user_id) do update set uploads_enabled=excluded.uploads_enabled,quota_bytes=excluded.quota_bytes,updated_at=now();
  select to_jsonb(s) into after_row from public.user_storage_controls s where user_id=p_user;
  insert into public.admin_storage_audit(actor_id,target_user_id,action,before_value,after_value) values(p_actor,p_user,'user_storage',before_row,after_row);
end; $$;
revoke all on function public.admin_save_platform_storage(uuid,boolean,bigint,bigint) from public, anon, authenticated;
revoke all on function public.admin_save_user_storage(uuid,uuid,boolean,bigint) from public, anon, authenticated;
grant execute on function public.admin_save_platform_storage(uuid,boolean,bigint,bigint) to service_role;
grant execute on function public.admin_save_user_storage(uuid,uuid,boolean,bigint) to service_role;

create or replace function public.r2_storage_usage() returns bigint language sql stable security definer set search_path='' as $$ select coalesce(sum(bytes),0)::bigint from public.media_uploads; $$;
revoke all on function public.r2_storage_usage() from public,anon,authenticated;
grant execute on function public.r2_storage_usage() to service_role;
