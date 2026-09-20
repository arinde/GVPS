import type { CookieOptions } from "express";

/**
 * How a refresh-token cookie is set, for staff and for the family portal.
 *
 * In development both apps share localhost, so "strict" is right: the cookie
 * never leaves the site. Deployed, the web app and the API sit on different
 * domains (Vercel and Render), which makes every request cross-site — a
 * "strict" or "lax" cookie is simply not sent, and nobody could stay signed
 * in. "none" is what allows it, and browsers only accept that over HTTPS,
 * which is why it comes with `secure`.
 */
export function refreshCookieOptions(path: string): CookieOptions {
  const crossSite = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: crossSite,
    sameSite: crossSite ? "none" : "strict",
    path,
  };
}

/** Clearing a cookie only works when secure, sameSite and path match how it was set. */
export function clearCookieOptions(path: string): CookieOptions {
  const { secure, sameSite } = refreshCookieOptions(path);
  return { secure, sameSite, path };
}
