import assert from "node:assert/strict";
import test from "node:test";
import { getVerifiedIdentity } from "../src/lib/verified-identity.ts";

const client = (claims, error = null) => ({ auth: { getClaims: async () => ({ data: claims ? { claims } : null, error }) } });

test("page identity requires successful SDK verification and a nonempty subject", async () => {
  for (const claims of [null, {}, { sub: "" }, { sub: 42 }]) {
    assert.equal(await getVerifiedIdentity(client(claims)), null);
  }
  assert.equal(await getVerifiedIdentity(client({ sub: "user-1", email: "a@example.test" }, new Error("invalid signature"))), null);
});

test("page identity uses only verified subject and email", async () => {
  assert.deepEqual(await getVerifiedIdentity(client({ sub: "user-1", email: "a@example.test", role: "admin" })), { id: "user-1", email: "a@example.test" });
  assert.deepEqual(await getVerifiedIdentity(client({ sub: "user-2", email: 123 })), { id: "user-2", email: null });
});
