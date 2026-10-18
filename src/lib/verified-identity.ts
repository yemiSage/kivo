type ClaimsClient = {
  auth: {
    getClaims(): Promise<{
      data: { claims: { sub?: unknown; email?: unknown } } | null;
      error: unknown;
    }>;
  };
};

/** Identity comes only from SDK-verified claims, never the cookie's user object. */
export async function getVerifiedIdentity(client: ClaimsClient) {
  const { data, error } = await client.auth.getClaims();
  const claims = data?.claims;
  if (error || typeof claims?.sub !== "string" || !claims.sub) return null;
  return { id: claims.sub, email: typeof claims.email === "string" ? claims.email : null };
}
