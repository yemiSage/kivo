-- Kivo: initial schema
-- Run in the Supabase SQL editor, or with `supabase db push`.

create extension if not exists pg_trgm;

-- ───────────────────────────── Collections ─────────────────────────────
create table public.collections (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 60),
  emoji       text check (emoji is null or char_length(emoji) <= 8),
  created_at  timestamptz not null default now(),
  unique (user_id, name)
);
create index collections_user_idx on public.collections (user_id, created_at);

-- ──────────────────────────────── Items ────────────────────────────────
create type public.item_kind as enum ('image', 'video', 'article', 'post', 'link');

create table public.items (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind                public.item_kind not null default 'link',
  url                 text check (url is null or char_length(url) <= 2048),
  canonical_url       text check (canonical_url is null or char_length(canonical_url) <= 2048),
  title               text check (title is null or char_length(title) <= 500),
  description         text check (description is null or char_length(description) <= 2000),
  thumbnail_url       text check (thumbnail_url is null or char_length(thumbnail_url) <= 2048),
  site_name           text,
  platform            text,
  author              text,
  storage_path        text,           -- uploaded media in the private `media` bucket
  collection_id       uuid references public.collections (id) on delete set null,
  tags                text[] not null default '{}',
  notes               text check (notes is null or char_length(notes) <= 10000),
  suggested_category  text,
  metadata_status     text not null default 'pending'
                      check (metadata_status in ('pending', 'ok', 'partial', 'failed')),
  search              tsvector,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint items_has_source check (url is not null or storage_path is not null)
);

create index items_user_created_idx on public.items (user_id, created_at desc);
create index items_user_kind_idx    on public.items (user_id, kind);
create index items_collection_idx   on public.items (collection_id);
create index items_tags_idx         on public.items using gin (tags);
create index items_search_idx       on public.items using gin (search);
create index items_title_trgm_idx   on public.items using gin (title gin_trgm_ops);
-- One copy of a given link per user.
create unique index items_user_canonical_uniq on public.items (user_id, canonical_url)
  where canonical_url is not null;

-- Keep search vector + updated_at fresh.
create or replace function public.items_before_write() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  new.tags := coalesce(new.tags, '{}');
  new.search :=
      setweight(to_tsvector('simple', coalesce(new.title, '')), 'A')
   || setweight(to_tsvector('simple', array_to_string(new.tags, ' ')), 'A')
   || setweight(to_tsvector('simple', coalesce(new.site_name, '') || ' ' || coalesce(new.author, '')), 'B')
   || setweight(to_tsvector('simple', coalesce(new.description, '')), 'C')
   || setweight(to_tsvector('simple', coalesce(new.notes, '')), 'C');
  return new;
end $$;

create trigger items_before_write
  before insert or update on public.items
  for each row execute function public.items_before_write();

-- ────────────────────────────── Security ───────────────────────────────
alter table public.collections enable row level security;
alter table public.items       enable row level security;

create policy "collections: owner all" on public.collections
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "items: owner read"   on public.items for select using (user_id = auth.uid());
create policy "items: owner delete" on public.items for delete using (user_id = auth.uid());
create policy "items: owner insert" on public.items for insert with check (
  user_id = auth.uid()
  and (collection_id is null or exists (
    select 1 from public.collections c where c.id = collection_id and c.user_id = auth.uid()))
  and (storage_path is null or storage_path like auth.uid()::text || '/%')
);
create policy "items: owner update" on public.items for update using (user_id = auth.uid()) with check (
  user_id = auth.uid()
  and (collection_id is null or exists (
    select 1 from public.collections c where c.id = collection_id and c.user_id = auth.uid()))
  and (storage_path is null or storage_path like auth.uid()::text || '/%')
);

-- ─────────────────────────────── Search ────────────────────────────────
-- Full-text first, trigram/substring fallback so partial words still match.
create or replace function public.search_items(q text, kind_filter public.item_kind default null, lim int default 60)
returns setof public.items
language sql stable security invoker as $$
  select i.*
  from public.items i
  where i.user_id = auth.uid()
    and (kind_filter is null or i.kind = kind_filter)
    and (
         i.search @@ websearch_to_tsquery('simple', q)
      or i.title ilike '%' || q || '%'
      or i.notes ilike '%' || q || '%'
      or i.url   ilike '%' || q || '%'
      or exists (select 1 from unnest(i.tags) t where t ilike q || '%')
    )
  order by ts_rank(i.search, websearch_to_tsquery('simple', q)) desc, i.created_at desc
  limit least(greatest(lim, 1), 200);
$$;

-- ───────────────────────── Default collections ─────────────────────────
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.collections (user_id, name, emoji) values
    (new.id, 'Read Later', null),
    (new.id, 'Design Inspiration', null),
    (new.id, 'Business Ideas', null),
    (new.id, 'Recipes', null),
    (new.id, 'Products', null);
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────── Storage ───────────────────────────────
-- Private bucket; objects live under "<user_id>/…". Served via short-lived signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', false, 10485760,
        array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif', 'image/avif'])
on conflict (id) do nothing;

create policy "media: owner read" on storage.objects for select
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "media: owner insert" on storage.objects for insert
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "media: owner delete" on storage.objects for delete
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

-- ───────────────────── Future: semantic search (off) ────────────────────
-- create extension if not exists vector;
-- alter table public.items add column embedding vector(768);
-- create index on public.items using hnsw (embedding vector_cosine_ops);
-- Populate from title/description/notes with an embedding model in a background job,
-- then add a `match_items(query_embedding vector, …)` RPC alongside search_items.
