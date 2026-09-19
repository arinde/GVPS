import { createHash, randomBytes } from "node:crypto";

// Refresh tokens are high-entropy random bytes, not user secrets — a fast
// hash is enough to keep the DB from holding usable bearer tokens in plain
// text (unlike passwords, brute-forcing the hash isn't the threat model).
export function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

/** A random refresh token, for an httpOnly cookie. */
export function newRefreshToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Shown once to whoever issues it, printed on a slip, changed at first sign-in. */
export function generateTemporaryPassword(): string {
  return randomBytes(12).toString("base64url");
}

/**
 * The audience every access token carries. Staff and parent tokens share a
 * signing secret, so each guard accepts only its own audience — a parent's
 * token must never pass a staff route, whatever its payload claims.
 */
export const TOKEN_AUDIENCE = { staff: "gvps-staff", parent: "gvps-parent" } as const;
