import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
const actor="11111111-1111-4111-8111-111111111111", user="22222222-2222-4222-8222-222222222222";

test("admin settings enforce quotas and upload access, audit changes, and deny ordinary writes", async()=>{
 const db=new PGlite();
 try {
  await db.exec(`create role anon;create role authenticated;create role service_role;
   create schema auth;create table auth.users(id uuid primary key, email text, created_at timestamptz default now(),last_sign_in_at timestamptz);
   create schema storage;create table storage.objects(bucket_id text,name text,metadata jsonb);
   create table public.items(id uuid primary key default gen_random_uuid(),user_id uuid,storage_path text,created_at timestamptz default now());create table public.collections(user_id uuid);
   insert into auth.users(id) values ('${actor}'),('${user}');`);
  for(const file of ["0009_r2_storage_quotas.sql","0010_admin_storage_controls.sql"])await db.exec(readFileSync(new URL("../supabase/migrations/"+file,import.meta.url),"utf8"));
  const reserve=()=>db.query("insert into public.media_uploads(path,user_id,bytes) values ($1,$2,1048576)",[user+"/r2/"+crypto.randomUUID()+".webp",user]);
  await db.query("select public.admin_save_user_storage($1,$2,true,1048576)",[actor,user]);
  await reserve();
  await assert.rejects(reserve(),/storage allowance is full/);
  await db.query("select public.admin_save_user_storage($1,$2,false,null)",[actor,user]);
  await assert.rejects(reserve(),/uploads are currently paused/);
  await db.query("select public.admin_save_user_storage($1,$2,true,null)",[actor,user]);
  await reserve();
  await db.query("select public.admin_save_platform_storage($1,false,104857600,9000000000)",[actor]);
  await assert.rejects(reserve(),/uploads are currently paused/);
  const audit=(await db.query("select count(*)::int as n from public.admin_storage_audit")).rows[0].n;
  assert.equal(audit,4);
  await assert.rejects(db.query("select public.admin_save_platform_storage($1,true,104857600,10000000000)",[actor]),/check constraint/);
  assert.equal((await db.query("select count(*)::int as n from public.admin_storage_audit")).rows[0].n,audit);
  await db.exec("set role authenticated");
  await assert.rejects(db.query("select public.admin_save_user_storage($1,$2,false,null)",[actor,user]),/permission denied/);
  await assert.rejects(db.exec("update public.platform_storage_settings set uploads_enabled=true"),/permission denied/);
  await assert.rejects(db.exec("select * from public.admin_storage_audit"),/permission denied/);
  const settings=await db.query("select uploads_enabled from public.platform_storage_settings");assert.equal(settings.rows[0].uploads_enabled,false);
 } finally {await db.close();}
});
