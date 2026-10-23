import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { chromium } from "playwright";

let server;
let output = "";
let origin = process.env.TEST_APP_ORIGIN;
if (!origin) {
  const port = await new Promise((resolve, reject) => {
    const reservation = createServer();
    reservation.once("error", reject);
    reservation.listen(0, "127.0.0.1", () => {
      const address = reservation.address();
      reservation.close(error => error ? reject(error) : resolve(address.port));
    });
  });
  origin = `http://127.0.0.1:${port}`;
  server = spawn(process.execPath, ["--use-system-ca", "node_modules/next/dist/bin/next", "start", "-p", String(port)], { stdio: ["ignore", "pipe", "pipe"] });
  server.stdout.on("data", chunk => { output += chunk; });
  server.stderr.on("data", chunk => { output += chunk; });
}

const browser = await chromium.launch({ headless: true });
const next = "/login/auth-test-complete?source=share";
const login = `${origin}/login?next=${encodeURIComponent(next)}`;
const user = { id: "00000000-0000-4000-8000-000000000001", aud: "authenticated", role: "authenticated", email: "signup@example.test", app_metadata: { provider: "email", providers: ["email"] }, user_metadata: {}, created_at: new Date().toISOString() };
const encode = value => Buffer.from(JSON.stringify(value)).toString("base64url");
const session = { access_token: `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: user.id, aud: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600 })}.test-signature`, refresh_token: "test-refresh-token", expires_in: 3600, token_type: "bearer", user };

async function setup(viewport) {
  const context = await browser.newContext({ viewport, serviceWorkers: "block" });
  const page = await context.newPage();
  const state = { emails: 0, verifies: 0, exchanges: 0, send: "ok", verify: "invalid", errors: [] };
  page.on("pageerror", error => state.errors.push(error.message));
  // All Auth traffic is intercepted. These tests never send real email or create accounts.
  await page.route("**/auth/v1/**", async route => {
    const url = new URL(route.request().url());
    const reply = (status, data) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(data) });
    if (url.pathname.endsWith("/otp")) {
      state.emails++;
      const body = route.request().postDataJSON();
      assert.equal(body.create_user, true);
      assert.ok(body.code_challenge, "The installed SDK generates PKCE challenges");
      assert.equal(new URL(url.searchParams.get("redirect_to")).searchParams.get("next"), next);
      if (state.send === "network") return route.abort("failed");
      if (state.send === "cooldown") return reply(429, { code: "over_email_send_rate_limit", msg: "For security purposes, you can only request this after 50 seconds." });
      return reply(200, {});
    }
    if (url.pathname.endsWith("/verify")) {
      state.verifies++;
      if (state.verify === "ok") return reply(200, session);
      return reply(403, { code: "otp_expired", msg: "Token has expired or is invalid" });
    }
    if (url.pathname.endsWith("/token")) { state.exchanges++; return reply(200, session); }
    if (url.pathname.endsWith("/user")) return reply(200, user);
    return reply(400, { msg: "Unexpected mocked Auth request" });
  });
  await page.route(`**/login/auth-test-complete?*`, route => route.fulfill({ contentType: "text/html", body: "<h1>Mock authentication complete</h1>" }));
  return { context, page, state };
}

async function send(page) {
  await page.goto(`${login}&error=link`);
  await page.getByLabel("Email", { exact: true }).fill("signup@example.test");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("heading", { name: "Check your inbox" }).waitFor();
  assert.equal(new URL(page.url()).searchParams.has("error"), false, "Successful send clears the old failed-link state");
}

try {
  if (server) {
    const deadline = Date.now() + 45000;
    let ready = false;
    while (Date.now() < deadline && server.exitCode === null) {
      try { ready = (await fetch(`${origin}/login`)).status === 200; } catch {}
      if (ready) break;
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    assert.ok(ready, `Production server failed to start. ${output}`);
  }

  // Server-rendered controls must not submit a native GET before React is
  // attached. A slow connection exposed this race in the deployed login form.
  const slow = await setup({ width: 360, height: 800 });
  let releaseScripts;
  const scriptsPaused = new Promise(resolve => { releaseScripts = resolve; });
  await slow.page.route("**/_next/static/**", async route => {
    if (new URL(route.request().url()).pathname.endsWith(".js")) await scriptsPaused;
    await route.continue();
  });
  try {
    await slow.page.goto(login, { waitUntil: "commit" });
    await slow.page.getByLabel("Email", { exact: true }).waitFor({ state: "visible" });
    assert.equal(await slow.page.getByLabel("Email", { exact: true }).isEnabled(), false);
    assert.equal(await slow.page.getByRole("button", { name: "Getting ready…", exact: true }).isEnabled(), false);
    assert.equal(slow.state.emails, 0);
  } finally {
    releaseScripts();
  }
  await slow.page.getByLabel("Email", { exact: true }).fill("signup@example.test");
  await slow.page.getByRole("button", { name: "Continue", exact: true }).click();
  await slow.page.getByRole("heading", { name: "Check your inbox" }).waitFor();
  assert.equal(slow.state.emails, 1);
  assert.deepEqual(slow.state.errors, []);
  await slow.context.close();
  console.log("PASS delayed JavaScript: no native form submission before hydration; sign-in works once ready.");

  for (const viewport of [{ width: 360, height: 800 }, { width: 375, height: 812 }, { width: 390, height: 844 }, { width: 1440, height: 960 }]) {
    const { context, page, state } = await setup(viewport);
    await page.clock.install();
    await send(page);
    const resend = page.getByRole("button", { name: /Resend in \d+s/ });
    assert.equal(await resend.isEnabled(), false);
    assert.equal(state.emails, 1);
    await page.reload();
    await page.getByLabel("6-digit code").waitFor();
    assert.equal(await resend.isEnabled(), false);
    assert.equal(state.emails, 1, "Reload must not send another email");
    await page.clock.fastForward(61000);
    state.send = "cooldown";
    await page.getByRole("button", { name: "Resend", exact: true }).click();
    await page.getByRole("alert").filter({ hasText: "wait 50 seconds" }).waitFor();
    assert.equal(await page.getByLabel("6-digit code").getAttribute("aria-invalid"), "false");
    assert.doesNotMatch(await page.locator("main").innerText(), /built-in email|one hour|connect custom SMTP/);
    await page.getByLabel("6-digit code").fill("123456");
    await page.getByRole("alert").filter({ hasText: "That code is invalid" }).waitFor();
    assert.equal(state.verifies, 1);
    assert.equal(await page.getByLabel("6-digit code").isEnabled(), true);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    state.verify = "ok";
    await page.getByLabel("6-digit code").fill("654321");
    await page.getByRole("heading", { name: "Mock authentication complete" }).waitFor();
    assert.equal(state.verifies, 2);
    assert.ok((await context.cookies()).some(cookie => /auth-token(?:\.\d+)?$/.test(cookie.name)), "OTP success must persist the SSR session cookie");
    assert.deepEqual(state.errors, []);
    await context.close();
    console.log(`PASS ${viewport.width}px: request, persisted cooldown, accurate 429, code remains usable, OTP cookie and viewport fit.`);
  }

  const pkce = await setup({ width: 390, height: 844 });
  await send(pkce.page);
  await pkce.page.goto(`${origin}/auth/implicit?code=test-pkce-code&next=${encodeURIComponent(next)}`);
  await pkce.page.getByRole("heading", { name: "Mock authentication complete" }).waitFor();
  assert.equal(pkce.state.exchanges, 1, "A PKCE link must not be exchanged twice");
  assert.ok((await pkce.context.cookies()).some(cookie => /auth-token(?:\.\d+)?$/.test(cookie.name)));
  await pkce.context.close();
  console.log("PASS real SDK PKCE query-code callback, exactly one exchange and SSR cookie persistence.");

  const implicit = await setup({ width: 390, height: 844 });
  await implicit.page.goto(`${origin}/auth/implicit?next=${encodeURIComponent(next)}#access_token=${session.access_token}&refresh_token=${session.refresh_token}`);
  await implicit.page.getByRole("heading", { name: "Mock authentication complete" }).waitFor();
  assert.equal(implicit.state.exchanges, 0);
  await implicit.context.close();
  console.log("PASS legacy implicit fragment-token callback.");

  const recovery = await setup({ width: 320, height: 700 });
  await recovery.page.goto(`${origin}/auth/implicit?code=missing-verifier&next=${encodeURIComponent(next)}`);
  await recovery.page.getByText("Open the email link in the browser where you requested it", { exact: false }).waitFor();
  assert.equal(new URL(recovery.page.url()).searchParams.get("next"), next);
  assert.ok(await recovery.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  recovery.state.send = "network";
  await recovery.page.getByLabel("Email", { exact: true }).fill("signup@example.test");
  await recovery.page.getByRole("button", { name: "Continue", exact: true }).click();
  await recovery.page.getByRole("main").getByRole("alert").waitFor();
  assert.equal(await recovery.page.getByRole("button", { name: "Continue", exact: true }).isEnabled(), true);

  await recovery.page.goto(`${origin}/auth/implicit?next=${encodeURIComponent(next)}&token_hash=scanner-test&type=email`);
  await recovery.page.getByRole("heading", { name: "Continue to Kivo" }).waitFor();
  assert.equal(recovery.state.verifies, 0, "GET/prefetch must never consume a token");
  assert.equal(await recovery.page.locator("form").getAttribute("method"), "post");
  assert.ok(await recovery.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  const response = await recovery.context.request.get(`${origin}/auth/confirm?token_hash=scanner-test&type=email&next=${encodeURIComponent(next)}`);
  assert.equal(response.status(), 200);
  assert.match(response.headers()["cache-control"], /no-store/);
  assert.equal(response.headers()["referrer-policy"], "no-referrer");
  assert.match(response.headers()["x-robots-tag"], /noindex/);
  for (const requestOrigin of [undefined, "https://untrusted.example"]) {
    const denied = await recovery.context.request.post(`${origin}/auth/confirm`, { headers: requestOrigin ? { origin: requestOrigin } : {}, form: { token_hash: "unused", type: "email", next } });
    assert.equal(denied.status(), 403);
  }
  for (const type of ["recovery", "email_change", "invite"]) {
    const denied = await recovery.context.request.post(`${origin}/auth/confirm`, { headers: { origin }, form: { token_hash: "unused", type, next: "//untrusted.example" }, maxRedirects: 0 });
    assert.equal(denied.status(), 303);
    assert.equal(new URL(denied.headers().location).searchParams.get("next"), "/");
  }
  assert.deepEqual(recovery.state.errors, []);
  await recovery.context.close();
  console.log("PASS 320px recovery, network retry, preserved destination, scanner-safe GET, POST origin/type checks and safe redirect.");
} finally {
  await browser.close();
  if (server) {
    server.kill();
    if (server.exitCode === null) await Promise.race([once(server, "exit"), new Promise(resolve => setTimeout(resolve, 3000))]);
  }
}
