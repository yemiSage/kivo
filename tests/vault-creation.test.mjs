import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

for (const helperSchema of ["public", "private"]) {
test(`owners can create and return vaults with the ${helperSchema} helper while other users cannot read them`, async () => {
  const db = new PGlite();
  const owner = "11111111-1111-4111-8111-111111111111";
  const other = "22222222-2222-4222-8222-222222222222";
  try {
    await db.exec(`
      create role authenticated;
      create schema auth;
      create schema private;
      grant usage on schema private to authenticated;
      create function auth.uid() returns uuid language sql stable as
        $$ select current_setting('request.jwt.claim.sub', true)::uuid $$;
      create table collections(id uuid primary key default gen_random_uuid(), user_id uuid, name text);
      create table vault_memberships(vault_id uuid, user_id uuid);
      alter table collections enable row level security;
      grant usage on schema auth to authenticated;
      grant select, insert on collections to authenticated;
    `);
    const shared = readFileSync(new URL("../supabase/migrations/0002_shared_vaults.sql", import.meta.url), "utf8")
      .replaceAll("public.can_access_vault", `${helperSchema}.can_access_vault`);
    await db.exec(shared.match(/create or replace function (?:public|private)\.can_access_vault\(vault uuid\)[\s\S]*?\$\$;/)[0]);
    await db.exec(shared.match(/create policy "vaults: members read"[^;]+;/)[0]);
    await db.exec(shared.match(/create policy "vaults: owner insert"[^;]+;/)[0]);
    await db.exec(readFileSync(new URL("../supabase/migrations/0010_fix_vault_creation.sql", import.meta.url), "utf8"));
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${owner}';`);
    // Mirrors Supabase insert(...).select("*").single().
    const result = await db.query("insert into collections(user_id, name) values ($1, 'Travel') returning *", [owner]);
    assert.equal(result.rows[0].name, "Travel");
    await db.exec(`set request.jwt.claim.sub = '${other}'`);
    assert.equal((await db.query("select * from collections")).rows.length, 0);
    await assert.rejects(db.query("insert into collections(user_id, name) values ($1, 'Forged') returning *", [owner]), /row-level security/);
    await db.exec("reset role");
    await db.query("insert into vault_memberships values ($1, $2)", [result.rows[0].id, other]);
    await db.exec("set role authenticated");
    assert.equal((await db.query("select * from collections")).rows.length, 1);
  } finally {
    await db.close();
  }
});
}
