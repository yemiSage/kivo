export const EMAIL_RESEND_SECONDS = 60;
export const EMAIL_REQUEST_KEY = "kivo-email-request-v1";
const REQUEST_LIFETIME_MS = 60 * 60 * 1000;

type EmailAuthError = { code?: string; status?: number; message?: string };

/** A 429 can mean a per-address cooldown, an IP limit, or the project quota. */
export function emailSendFailure(error: EmailAuthError) {
  const wait = error.message?.match(/after\s+(\d+)\s+seconds?/i);
  if (wait) {
    const retrySeconds = Math.min(3600, Math.max(1, Number(wait[1])));
    return { message: `Please wait ${retrySeconds} seconds before requesting another email. You can still enter the code from your latest email.`, retrySeconds };
  }
  if (error.code === "over_email_send_rate_limit") {
    return { message: "Sign-in emails are temporarily limited. Please try again later, or enter the code from your latest email.", retrySeconds: EMAIL_RESEND_SECONDS };
  }
  if (error.status === 429 || error.code === "over_request_rate_limit") {
    return { message: "Too many sign-in attempts. Please wait a few minutes before trying again.", retrySeconds: EMAIL_RESEND_SECONDS };
  }
  if (error.code === "email_address_not_authorized" || error.status === 500) {
    return { message: "We couldn’t send your sign-in email. Please try again later. If this continues, contact Kivo support.", retrySeconds: EMAIL_RESEND_SECONDS };
  }
  return { message: "We couldn’t send your sign-in email. Check your connection and email address, then try again.", retrySeconds: 0 };
}

export type PendingEmailRequest = { email: string; next: string; sentAt: number; retryAt: number };

/** Never restore codes, tokens or sessions. Treat browser storage as untrusted. */
export function readPendingEmail(raw: string | null, now = Date.now()): PendingEmailRequest | null {
  try {
    const value = JSON.parse(raw ?? "null");
    if (!value || typeof value.email !== "string" || value.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email) || typeof value.next !== "string" || typeof value.sentAt !== "number" || !Number.isFinite(value.sentAt) || value.sentAt > now || now - value.sentAt >= REQUEST_LIFETIME_MS || typeof value.retryAt !== "number" || !Number.isFinite(value.retryAt)) return null;
    return { email: value.email, next: value.next, sentAt: value.sentAt, retryAt: Math.min(value.retryAt, now + REQUEST_LIFETIME_MS) };
  } catch {
    return null;
  }
}

export function secondsUntil(retryAt: number, now = Date.now()) {
  return Math.max(0, Math.ceil((retryAt - now) / 1000));
}

/** Only the sign-in/signup types belong to this confirmation flow. */
export function emailOtpType(value: unknown): "email" | "signup" | "magiclink" | null {
  return value === "email" || value === "signup" || value === "magiclink" ? value : null;
}

export function loginRecoveryPath(reason: "link" | "browser", next: string) {
  return `/login?${new URLSearchParams({ error: reason, next })}`;
}

type AuthResult = { data: { session: unknown }; error: unknown };
type LinkAuth = {
  exchangeCodeForSession(code: string): Promise<AuthResult>;
  setSession(tokens: { access_token: string; refresh_token: string }): Promise<AuthResult>;
};

/** Legacy emails can return PKCE query codes or implicit fragment tokens. */
export async function finishEmailLink(auth: LinkAuth, search: string, hash: string): Promise<"ok" | "browser" | "link"> {
  const query = new URLSearchParams(search);
  const fragment = new URLSearchParams(hash.replace(/^#/, ""));
  if (query.has("error") || fragment.has("error")) return "link";
  const code = query.get("code");
  if (code) {
    const { data, error } = await auth.exchangeCodeForSession(code);
    return !error && data.session ? "ok" : "browser";
  }
  const accessToken = fragment.get("access_token");
  const refreshToken = fragment.get("refresh_token");
  if (!accessToken || !refreshToken) return "link";
  const { data, error } = await auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
  return !error && data.session ? "ok" : "link";
}
