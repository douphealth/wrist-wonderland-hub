import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// =====================================================================
// Brevo lead-capture server function.
//
// Mirrors the proven "brevo-subscribe" edge function from RunMatch AI:
//   1. Upsert the contact with rich quiz attributes.
//   2. Add to a list keyed by lead source (so Brevo Automations can drip
//      the multi-day expert email sequence on Days 2–21).
//   3. Immediately send the Day-0 welcome email so the user gets value
//      within seconds — either a configured Brevo template or a polished
//      inline-HTML fallback so this works without any Brevo dashboard
//      setup.
//
// The Brevo API key never leaves the server. All client calls go through
// the validated server function below.
// =====================================================================

const utmSchema = z
  .object({
    source: z.string().max(100).optional(),
    medium: z.string().max(100).optional(),
    campaign: z.string().max(100).optional(),
    term: z.string().max(100).optional(),
    content: z.string().max(100).optional(),
    referrer: z.string().max(500).optional(),
    landing: z.string().max(500).optional(),
  })
  .partial()
  .optional();

const subscribeSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(255)
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"),
  firstName: z.string().trim().max(100).optional(),
  source: z.enum(["quiz_gate", "exit_popup", "inline_hero", "footer", "blog_inline"]),
  consent: z.literal(true),
  // Quiz / match context (all optional so we can also use this for footer / hero).
  topMatchBrand: z.string().max(100).optional(),
  topMatchModel: z.string().max(150).optional(),
  category: z.string().max(50).optional(),
  phoneOS: z.string().max(20).optional(),
  batteryPref: z.coerce.number().int().min(0).max(120).optional(),
  watchMatchURL: z.string().url().max(500).optional(),
  utm: utmSchema,
});

export type SubscribeInput = z.infer<typeof subscribeSchema>;

// Source → Brevo list mapping. The user can wire these list IDs in their
// Brevo dashboard. Falls back to list 1 if the env override is missing.
function listIdFor(source: SubscribeInput["source"]): number {
  const env =
    process.env.BREVO_LIST_ID_QUIZ_GATE ??
    process.env.BREVO_LIST_ID ??
    "1";
  const fallback = parseInt(env, 10) || 1;
  const map: Record<SubscribeInput["source"], number> = {
    quiz_gate: parseInt(process.env.BREVO_LIST_ID_QUIZ_GATE ?? "", 10) || fallback,
    exit_popup: parseInt(process.env.BREVO_LIST_ID_EXIT_POPUP ?? "", 10) || fallback,
    inline_hero: parseInt(process.env.BREVO_LIST_ID_INLINE_HERO ?? "", 10) || fallback,
    footer: parseInt(process.env.BREVO_LIST_ID_FOOTER ?? "", 10) || fallback,
    blog_inline: parseInt(process.env.BREVO_LIST_ID_BLOG_INLINE ?? "", 10) || fallback,
  };
  return map[source];
}

function senderName(): string {
  return process.env.BREVO_SENDER_NAME ?? "GearUpToFit · WatchMatch AI";
}
function senderEmail(): string {
  return process.env.BREVO_SENDER_EMAIL ?? "info@gearuptofit.com";
}

const PUBLIC_APP_ORIGIN = "https://wrist-wonderland-hub.lovable.app";
const GEARUPTOFIT_ORIGIN = "https://gearuptofit.com";

function normalizeReportURL(raw?: string): string {
  if (!raw) return `${PUBLIC_APP_ORIGIN}/watch-match/`;
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    if (host.includes("lovableproject.com") || host.includes("id-preview") || host === "lovable.dev") {
      url.protocol = "https:";
      url.host = new URL(PUBLIC_APP_ORIGIN).host;
    }
    return url.toString();
  } catch {
    return `${PUBLIC_APP_ORIGIN}/watch-match/`;
  }
}

function guideURL(path: string): string {
  return `${GEARUPTOFIT_ORIGIN}/${path.replace(/^\//, "")}`;
}

function welcomeHTML(input: SubscribeInput): { subject: string; html: string } {
  const name = input.firstName?.trim() || "there";
  const brand = input.topMatchBrand ?? "your match";
  const model = input.topMatchModel ?? "";
  const url = input.watchMatchURL ?? "https://gearuptofit.com/watch-match/";
  const subject = `${name}, your WatchMatch result + the spec most buyers regret ignoring`;
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#0b0b10;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e9e9ee;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0b0b10;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#13131a;border:1px solid #26262f;border-radius:16px;overflow:hidden;">
        <tr><td style="padding:28px 32px 8px;">
          <div style="font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:#ff3b6b;font-weight:700;">WatchMatch AI · GearUpToFit</div>
          <h1 style="margin:14px 0 6px;font-size:26px;line-height:1.15;color:#fff;letter-spacing:-.01em;">Hi ${escapeHTML(name)} — your match is ready.</h1>
          <p style="margin:0;color:#a8a8b3;font-size:15px;line-height:1.55;">Thanks for trusting GearUpToFit to help you choose your next watch.</p>
        </td></tr>
        <tr><td style="padding:18px 32px 8px;">
          <div style="background:linear-gradient(135deg,rgba(255,59,107,.12),rgba(255,59,107,.04));border:1px solid rgba(255,59,107,.35);border-radius:12px;padding:18px 20px;">
            <div style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#ff3b6b;font-weight:700;margin-bottom:6px;">Your top match</div>
            <div style="font-size:20px;font-weight:700;color:#fff;">${escapeHTML(brand)} ${escapeHTML(model)}</div>
          </div>
        </td></tr>
        <tr><td style="padding:18px 32px 4px;color:#cfcfd6;font-size:15px;line-height:1.65;">
          <p style="margin:0 0 14px;">Before you click <em>buy</em>, one quick warning. The single spec most buyers regret ignoring isn't battery, screen size, or sensors — it's <strong>GPS architecture</strong>.</p>
          <p style="margin:0 0 14px;">Single-frequency GPS will drift 30–80 m on tree-lined trails and city blocks. Multi-band (L1+L5) holds within 5 m. If you run, hike, or cycle outside a track, this is the spec that decides whether your splits are real.</p>
          <p style="margin:0 0 6px;">If your match has multi-band, you're set. If not, your result page lists a near-equivalent that does — scroll to <strong>Alternate Pick</strong>.</p>
        </td></tr>
        <tr><td align="center" style="padding:22px 32px 8px;">
          <a href="${escapeAttr(url)}" style="display:inline-block;background:#ff3b6b;color:#fff;text-decoration:none;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:14px 26px;border-radius:12px;font-size:14px;">Open my full WatchMatch report</a>
        </td></tr>
        <tr><td style="padding:14px 32px 4px;color:#9a9aa3;font-size:13px;line-height:1.6;">
          <p style="margin:0 0 6px;"><strong style="color:#e9e9ee;">What happens next:</strong></p>
          <ul style="margin:6px 0 14px 18px;padding:0;">
            <li>Day 2 — the 3-watch rotation that lowers injury &amp; battery anxiety</li>
            <li>Day 4 — the only 4 sensors that actually change a buying decision</li>
            <li>Day 7 — a head-to-head: your match vs. its biggest rival</li>
            <li>Day 14 — straps, charging cradles &amp; accessories worth owning</li>
          </ul>
        </td></tr>
        <tr><td style="padding:8px 32px 28px;color:#74747d;font-size:12px;line-height:1.6;border-top:1px solid #26262f;">
          You're getting this because you took the WatchMatch quiz on GearUpToFit and asked us to email you the result. Reply with "stop" any time and we'll remove you immediately.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
  return { subject, html };
}

function escapeHTML(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&#39;",
  );
}
function escapeAttr(s: string): string {
  return escapeHTML(s);
}

export const subscribeLead = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => subscribeSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      return { success: false, error: "Email service not configured" } as const;
    }

    const attributes: Record<string, unknown> = {
      FIRSTNAME: data.firstName ?? "",
      SOURCE: data.source,
      TOP_MATCH_BRAND: data.topMatchBrand ?? "",
      TOP_MATCH_MODEL: data.topMatchModel ?? "",
      WATCH_CATEGORY: data.category ?? "",
      PHONE_OS: data.phoneOS ?? "",
      BATTERY_PREF_DAYS: data.batteryPref ?? null,
      WATCHMATCH_URL: data.watchMatchURL ?? "",
      UTM_SOURCE: data.utm?.source ?? "",
      UTM_MEDIUM: data.utm?.medium ?? "",
      UTM_CAMPAIGN: data.utm?.campaign ?? "",
      REFERRER: data.utm?.referrer ?? "",
      OPT_IN_DATE: new Date().toISOString(),
    };

    // 1. Upsert the contact + add to its source list.
    const upsertRes = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        email: data.email,
        attributes,
        listIds: [listIdFor(data.source)],
        updateEnabled: true,
      }),
    });

    const upsertText = await upsertRes.text();
    let upsertJson: unknown = null;
    try {
      upsertJson = upsertText ? JSON.parse(upsertText) : null;
    } catch {
      // ignore — Brevo sometimes returns empty body on 204
    }
    const duplicateOk =
      upsertJson &&
      typeof upsertJson === "object" &&
      (upsertJson as { code?: string }).code === "duplicate_parameter";

    if (!upsertRes.ok && !duplicateOk) {
      console.error("brevo upsert failed", upsertRes.status, upsertText);
      return {
        success: false,
        error: "Subscription failed. Please try again.",
      } as const;
    }

    // 2. Send Day-0 welcome — Brevo template if configured, otherwise our
    //    polished inline HTML so this works out of the box.
    let welcomeSent = false;
    try {
      const templateIdRaw = process.env.BREVO_WELCOME_TEMPLATE_ID;
      const templateId = templateIdRaw ? parseInt(templateIdRaw, 10) : NaN;
      const sendBody: Record<string, unknown> = {
        sender: { name: senderName(), email: senderEmail() },
        to: [{ email: data.email, name: data.firstName || undefined }],
        tags: ["watchmatch-day-0", `source-${data.source}`],
        headers: { "X-Mailin-Custom": "drip:0" },
      };
      if (Number.isFinite(templateId) && templateId > 0) {
        sendBody.templateId = templateId;
        sendBody.params = {
          FIRSTNAME: data.firstName || "runner",
          TOP_MATCH_BRAND: data.topMatchBrand || "",
          TOP_MATCH_MODEL: data.topMatchModel || "",
          WATCH_CATEGORY: data.category || "",
          WATCHMATCH_URL: data.watchMatchURL || "",
        };
      } else {
        const { subject, html } = welcomeHTML(data);
        sendBody.subject = subject;
        sendBody.htmlContent = html;
      }
      const sendRes = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": apiKey,
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify(sendBody),
      });
      welcomeSent = sendRes.ok;
      if (!sendRes.ok) {
        const errTxt = await sendRes.text();
        console.error("brevo welcome send failed", sendRes.status, errTxt);
      }
    } catch (err) {
      console.error("brevo welcome send exception", err);
    }

    return { success: true, welcomeSent } as const;
  });