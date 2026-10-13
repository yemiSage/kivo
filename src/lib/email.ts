import "server-only";
import { env } from "@/lib/env";

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]!);
}

export async function sendVaultInviteEmail(input: { to: string; vaultName: string; inviter: string; inviteUrl: string }) {
  if (!env.brevoApiKey || !env.fromEmail) throw new Error("Email invitations are not configured.");

  const vault = escapeHtml(input.vaultName);
  const inviter = escapeHtml(input.inviter);
  const url = escapeHtml(input.inviteUrl);
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": env.brevoApiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: "Kivo", email: env.fromEmail },
      to: [{ email: input.to }],
      subject: `${input.inviter} invited you to ${input.vaultName} on Kivo`,
      htmlContent: `<!doctype html><html><body style="margin:0;background:#f3f3f0;font-family:Arial,sans-serif;color:#0a0a0a"><div style="max-width:520px;margin:40px auto;background:#fff;border-radius:20px;padding:32px"><p style="font-weight:700;font-size:20px;margin:0 0 28px">Kivo</p><h1 style="font-size:24px;margin:0 0 12px">Join ${vault}</h1><p style="color:#5f5f5c;line-height:1.6">${inviter} invited you to collaborate in a shared Kivo vault. You can save, edit, and remove items together.</p><a href="${url}" style="display:block;margin-top:24px;background:#0a0a0a;color:#fff;text-decoration:none;text-align:center;border-radius:10px;padding:12px 18px;font-weight:600">Join shared vault</a><p style="margin-top:24px;color:#777;font-size:12px">This invitation expires in 7 days and only works for this email address.</p></div></body></html>`,
      tags: ["vault-invite"],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("[brevo]", response.status, detail.slice(0, 500));
    throw new Error("Brevo could not send the invitation.");
  }
}
