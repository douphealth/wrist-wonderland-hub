import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { z } from "zod";

/**
 * Server-enforced 24-hour expiry for a personalized report slug.
 *
 * The expiry timestamp is stored in an HttpOnly cookie keyed by slug so the
 * countdown survives reloads but cannot be tampered with from the browser.
 * When the cookie is missing or already past, we issue a fresh 24h window.
 */
const TWENTY_FOUR_H = 60 * 60 * 24; // seconds

function cookieName(slug: string): string {
  // Cookie names can't contain most special chars — sanitize aggressively.
  const safe = slug.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
  return `wm_exp_${safe}`;
}

export const getReportExpiry = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      slug: z.string().min(1).max(200).regex(/^[a-zA-Z0-9-]+$/),
    }).parse,
  )
  .handler(async ({ data }) => {
    const name = cookieName(data.slug);
    const now = Date.now();
    const existing = getCookie(name);
    const parsed = existing ? Number(existing) : NaN;

    let expiresAt: number;
    if (Number.isFinite(parsed) && parsed > now) {
      expiresAt = parsed;
    } else {
      expiresAt = now + TWENTY_FOUR_H * 1000;
      setCookie(name, String(expiresAt), {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: TWENTY_FOUR_H,
      });
    }
    return { expiresAt, issuedAt: now };
  });