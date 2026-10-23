import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test from "node:test";
import { NextRequest } from "next/server.js";

// Exercise the real route handlers with an isolated provider adapter. No hosted
// Auth calls, tokens, accounts or Next request-cookie context are needed.
const provider = { calls: 0, response: { data: { session: {} }, error: null }, fail: false };
globalThis.kivoTestEmailProvider = provider;
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "@/lib/supabase/server") return { url: "kivo-test:email-provider", shortCircuit: true };
    if (specifier === "next/server") return nextResolve("next/server.js", context);
    if (specifier.startsWith("@/")) return nextResolve(new URL(`../src/${specifier.slice(2)}.ts`, import.meta.url).href, context);
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === "kivo-test:email-provider") return {
      format: "module", shortCircuit: true,
      source: `export async function getServerSupabase() { return { auth: { verifyOtp: async input => { const state = globalThis.kivoTestEmailProvider; state.calls++; state.input = input; if (state.fail) throw new Error("private provider details"); return state.response; } } }; }`,
    };
    return nextLoad(url, context);
  },
});
const { GET, POST } = await import("../src/app/auth/confirm/route.ts");
hooks.deregister();

function post(fields, origin = "https://kivo.test", host = "kivo.test") {
  return new NextRequest("https://localhost/auth/confirm", { method: "POST", headers: { host, ...(origin ? { origin } : {}), "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(fields) });
}

test("GET and scanner revisits never call verification", async () => {
  for (let index = 0; index < 2; index++) {
    const response = await GET(new NextRequest("https://kivo.test/auth/confirm?token_hash=one-use&type=email&next=%2Fsave"));
    assert.equal(response.status, 303);
    assert.equal(new URL(response.headers.get("location")).pathname, "/auth/verify");
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("referrer-policy"), "no-referrer");
  }
  assert.equal(provider.calls, 0);
});

test("confirmation rejects missing/cross-origin submissions and unrelated OTP purposes", async () => {
  for (const origin of [null, "https://untrusted.test", "http://kivo.test"]) assert.equal((await POST(post({ token_hash: "one-use", type: "email" }, origin))).status, 403);
  for (const type of ["recovery", "invite", "email_change", "", "unknown"]) {
    const response = await POST(post({ token_hash: "one-use", type, next: "//untrusted.test" }));
    assert.equal(response.status, 303);
    assert.equal(new URL(response.headers.get("location")).searchParams.get("next"), "/");
  }
  assert.equal(provider.calls, 0);
});

test("same-origin POST verifies once and requires a provider session", async () => {
  const response = await POST(post({ token_hash: "one-use", type: "email", next: "/save?source=share" }));
  assert.equal(provider.calls, 1);
  assert.deepEqual(provider.input, { token_hash: "one-use", type: "email" });
  assert.equal(response.headers.get("location"), "https://kivo.test/save?source=share");
  provider.response = { data: { session: null }, error: { message: "private provider details" } };
  const failure = await POST(post({ token_hash: "used-token", type: "email", next: "/save?source=share" }));
  assert.equal(new URL(failure.headers.get("location")).searchParams.get("next"), "/save?source=share");
  assert.doesNotMatch(failure.headers.get("location"), /used-token|private provider/);
});

test("provider exceptions recover safely without losing the destination", async () => {
  provider.fail = true;
  const response = await POST(post({ token_hash: "one-use", type: "email", next: "/admin" }));
  assert.equal(response.status, 303);
  const target = new URL(response.headers.get("location"));
  assert.equal(target.searchParams.get("error"), "link");
  assert.equal(target.searchParams.get("next"), "/admin");
  assert.doesNotMatch(target.href, /one-use|private provider/);
});
