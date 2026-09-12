export type AccessTokenClaims = {
  sub: string;
  schoolId: string;
  email: string;
  roles: string[];
  mustChangePassword: boolean;
  iat: number;
  exp: number;
};

/**
 * Decodes the token's payload for UI purposes only (e.g. hiding a nav link)
 * — the signature is never checked here, so this is not a trust boundary.
 * The server re-verifies and re-authorizes every request regardless
 * (FEATURES.md §1.5: scoping is enforced in the API layer, never the client).
 */
export function decodeAccessToken(token: string): AccessTokenClaims | null {
  const payload = token.split(".")[1];
  if (!payload) return null;

  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64)) as AccessTokenClaims;
  } catch {
    return null;
  }
}
