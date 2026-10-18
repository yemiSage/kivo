import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { isR2Path, MAX_STORED_IMAGE_BYTES } from "../src/lib/storage-policy.ts";

const user = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
const path = user + "/r2/33333333-3333-4333-8333-333333333333.webp";

test("R2 paths distinguish legacy storage and reject malformed keys", () => {
  assert.equal(isR2Path(path), true);
  for (const bad of [user + "/old.jpg", user + "/r2/../../secret.webp", "https://example.com/file.webp", user + "/r2/file.svg"]) assert.equal(isR2Path(bad), false);
});

test("real PostgreSQL quota triggers, attachment checks and ledger permissions", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role;
      create schema auth; create table auth.users(id uuid primary key, email text, created_at timestamptz default now(), last_sign_in_at timestamptz);
      create schema storage; create table storage.objects(bucket_id text, name text, metadata jsonb);
      create table public.items(id uuid primary key default gen_random_uuid(), user_id uuid not null, storage_path text, created_at timestamptz default now());
      create table public.collections(user_id uuid);
      insert into auth.users(id) values ('${user}'), ('${other}');`);
    await db.exec(readFileSync(new URL("../supabase/migrations/0009_r2_storage_quotas.sql", import.meta.url), "utf8"));
    await db.query("insert into public.media_uploads(path,user_id,bytes) values ($1,$2,$3)",[path,user,MAX_STORED_IMAGE_BYTES]);
    await assert.rejects(db.query("insert into public.items(user_id,storage_path) values ($1,$2)",[user,path]), /Invalid or already attached/);
    await db.query("update public.media_uploads set state='ready' where path=$1",[path]);
    await assert.rejects(db.query("insert into public.items(user_id,storage_path) values ($1,$2)",[other,path]), /Invalid or already attached/);
    await db.query("insert into public.items(user_id,storage_path) values ($1,$2)",[user,path]);
    await assert.rejects(db.query("insert into public.items(user_id,storage_path) values ($1,$2)",[user,path]), /Invalid or already attached/);
    await db.query("delete from public.items where storage_path=$1",[path]);
    assert.equal((await db.query("select state from public.media_uploads where path=$1",[path])).rows[0].state,"delete_pending");
    await db.query("insert into storage.objects values ('media',$1,$2)",[user+"/legacy.jpg",JSON.stringify({size:99*MAX_STORED_IMAGE_BYTES})]);
    await assert.rejects(db.query("insert into public.media_uploads(path,user_id,bytes) values ($1,$2,1)",[user+"/r2/another.webp",user]), /100 MB storage allowance/);
    await db.query("delete from public.media_uploads where path=$1",[path]);
    await db.query("insert into public.media_uploads(path,user_id,bytes) values ($1,$2,$3)",[path,user,MAX_STORED_IMAGE_BYTES]);
    await assert.rejects(db.query("insert into public.media_uploads(path,user_id,bytes) values ($1,$2,$3)",[other+"/r2/large.webp",other,MAX_STORED_IMAGE_BYTES+1]), /check constraint/);
    await db.exec("set role authenticated");
    await assert.rejects(db.query("delete from public.media_uploads"), /permission denied/);
    await assert.rejects(db.query("insert into public.media_uploads(path,user_id,bytes) values ($1,$2,1)",[user+"/r2/forged.webp",user]), /permission denied/);
    await db.exec("reset role");
    await db.exec(`delete from public.media_uploads; alter table public.media_uploads disable trigger enforce_media_quota;
      insert into auth.users(id) select gen_random_uuid() from generate_series(1,90);
      insert into public.media_uploads(path,user_id,bytes) select u.id::text || '/r2/' || n::text || '.webp',u.id,1000000 from auth.users u cross join generate_series(1,100) n where u.id not in ('${user}','${other}');
      alter table public.media_uploads enable trigger enforce_media_quota;`);
    await assert.rejects(db.query("insert into public.media_uploads(path,user_id,bytes) values ($1,$2,1)",[other+"/r2/full.webp",other]), /Storage is temporarily full/);
  } finally { await db.close(); }
});
