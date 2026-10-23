import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { EMAIL_RESEND_SECONDS, emailSendFailure, emailOtpType, finishEmailLink, loginRecoveryPath, readPendingEmail, secondsUntil } from "../src/lib/email-auth.ts";

test("a per-email cooldown is not reported as an hourly or SMTP failure", () => {
  const result = emailSendFailure({ status: 429, code: "over_email_send_rate_limit", message: "For security purposes, you can only request this after 50 seconds." });
  assert.equal(result.retrySeconds, 50);
  assert.match(result.message, /wait 50 seconds/);
  assert.doesNotMatch(result.message, /hour|SMTP|Supabase/);
  assert.equal(emailSendFailure({ message: "after 0 seconds" }).retrySeconds, 1);
  assert.equal(emailSendFailure({ message: "after 999999 seconds" }).retrySeconds, 3600);
});

test("quota, IP, delivery and network failures have safe, distinct messages", () => {
  assert.match(emailSendFailure({ code: "over_email_send_rate_limit" }).message, /emails are temporarily limited/);
  assert.match(emailSendFailure({ code: "over_request_rate_limit", status: 429 }).message, /Too many sign-in attempts/);
  assert.match(emailSendFailure({ status: 429 }).message, /wait a few minutes/);
  for (const error of [{ code: "email_address_not_authorized" }, { status: 500, message: "smtp password secret" }, { message: "network detail secret" }]) {
    assert.doesNotMatch(emailSendFailure(error).message, /secret|smtp password/);
  }
});

test("pending email restores only valid recent requests and never codes or tokens", () => {
  const now = 10000000;
  const request = { email: "person@example.test", next: "/save?url=x", sentAt: now - 10000, retryAt: now + 50000 };
  assert.deepEqual(readPendingEmail(JSON.stringify({ ...request, token: "private" }), now), request);
  for (const raw of [null, "broken", "[]", "null", JSON.stringify({ ...request, email: "broken" }), JSON.stringify({ ...request, sentAt: now + 1 }), JSON.stringify({ ...request, sentAt: now - 3600000 }), JSON.stringify({ ...request, retryAt: "later" })]) assert.equal(readPendingEmail(raw, now), null);
  assert.equal(secondsUntil(request.retryAt, now), 50);
  assert.equal(secondsUntil(now - 1, now), 0);
  assert.equal(secondsUntil(now + 1, now), 1);
  assert.equal(EMAIL_RESEND_SECONDS, 60);
});

test("legacy PKCE links exchange their query code exactly once", async () => {
  const calls = [];
  const auth = {
    exchangeCodeForSession: async code => { calls.push(code); return { data: { session: {} }, error: null }; },
    setSession: async () => { throw new Error("Wrong flow"); },
  };
  assert.equal(await finishEmailLink(auth, "?code=valid-code", ""), "ok");
  assert.deepEqual(calls, ["valid-code"]);
  auth.exchangeCodeForSession = async () => ({ data: { session: null }, error: { code: "bad_code_verifier" } });
  assert.equal(await finishEmailLink(auth, "?code=other-browser", ""), "browser");
});

test("legacy implicit links require a full token pair and a verified SDK session", async () => {
  const calls = [];
  const auth = {
    exchangeCodeForSession: async () => { throw new Error("Wrong flow"); },
    setSession: async tokens => { calls.push(tokens); return { data: { session: {} }, error: null }; },
  };
  for (const fragment of ["", "#access_token=access", "#error=access_denied&access_token=access&refresh_token=refresh"]) assert.equal(await finishEmailLink(auth, "", fragment), "link");
  assert.deepEqual(calls, []);
  assert.equal(await finishEmailLink(auth, "", "#access_token=access&refresh_token=refresh"), "ok");
  assert.deepEqual(calls, [{ access_token: "access", refresh_token: "refresh" }]);
  auth.setSession = async () => ({ data: { session: null }, error: null });
  assert.equal(await finishEmailLink(auth, "", "#access_token=access&refresh_token=refresh"), "link");
});

test("email recovery preserves encoded destinations and limits confirmation types", () => {
  const next = "/save?url=https%3A%2F%2Fexample.test%2Fa%3Fb%3Dc&source=share";
  const url = new URL(loginRecoveryPath("browser", next), "https://kivo.test");
  assert.equal(url.searchParams.get("next"), next);
  for (const value of [null, "recovery", "invite", "email_change", ["email"]]) assert.equal(emailOtpType(value), null);
  for (const value of ["email", "signup", "magiclink"]) assert.equal(emailOtpType(value), value);
});

test("both maintained templates include a code and a scanner-safe app link", () => {
  for (const name of ["confirm-signup", "magic-link"]) {
    const template = readFileSync(new URL(`../supabase/templates/${name}.html`, import.meta.url), "utf8");
    assert.match(template, /{{ \.Token }}/);
    assert.match(template, /{{ \.RedirectTo }}&amp;token_hash={{ \.TokenHash }}&amp;type=email/);
    assert.doesNotMatch(template, /ConfirmationURL/);
  }
});
