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

function welcomeHTML(input: SubscribeInput): { subject: string; html: string; text: string } {
  const name = input.firstName?.trim() || "there";
  const brand = input.topMatchBrand ?? "your match";
  const model = input.topMatchModel ?? "";
  const matchName = `${brand} ${model}`.trim();
  const category = input.category ?? "watch profile";
  const url = normalizeReportURL(input.watchMatchURL);
  const battery = input.batteryPref ? `${input.batteryPref}+ day` : "your preferred";
  const platform = input.phoneOS === "iphone" ? "iPhone" : input.phoneOS === "android" ? "Android" : "your phone";
  const subject = `${name}, your WatchMatch report is ready`;
  const text = `Hi ${name},

Your WatchMatch report is ready.

Top match: ${matchName}
Profile: ${category}
Context: ${platform}, ${battery} battery preference

Open your report here:
${url}

My quick read: do not buy on the headline spec alone. Before you decide, check three things in your report: case size on your wrist, real GPS mode for your routes, and battery life with the features you will actually keep switched on.

Over the next few notes, I will help you compare platform lock-in, battery claims, health sensors, and the alternates worth considering — short, practical, and written like a real buyer's guide.

Reply to this email if you want me to sanity-check a model before you buy.

Alex
GearUpToFit`;
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHTML(subject)}</title></head>
<body style="margin:0;background:#f5f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#17191f;">
  <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0;">Your personalized result, the three checks I would make before buying, and the next expert notes.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f6f8;padding:28px 14px;">
    <tr><td align="center">
      <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:640px;background:#ffffff;border:1px solid #e6e8ee;border-radius:18px;overflow:hidden;box-shadow:0 18px 60px rgba(17,24,39,.08);">
        <tr><td style="background:#11131a;padding:28px 30px 24px;">
          <div style="font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:#ff4f75;font-weight:800;">GearUpToFit · WatchMatch AI</div>
          <h1 style="margin:14px 0 10px;font-size:30px;line-height:1.12;color:#ffffff;font-weight:800;letter-spacing:-.02em;">Hi ${escapeHTML(name)} — I finished your watch report.</h1>
          <p style="margin:0;color:#c9cbd3;font-size:16px;line-height:1.6;">I built this around how you said you’ll actually use the watch — not around the loudest spec sheet.</p>
        </td></tr>
        <tr><td style="padding:26px 30px 10px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #eceef3;border-radius:14px;overflow:hidden;">
            <tr>
              <td style="padding:18px 20px;background:#fbfbfd;">
                <div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#6b7280;font-weight:800;margin-bottom:7px;">Your top match</div>
                <div style="font-size:24px;line-height:1.2;font-weight:800;color:#161821;">${escapeHTML(matchName)}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:15px 20px;background:#ffffff;border-top:1px solid #eceef3;color:#4b5563;font-size:14px;line-height:1.65;">
                <strong style="color:#161821;">Profile:</strong> ${escapeHTML(category)} &nbsp;·&nbsp; <strong style="color:#161821;">Phone:</strong> ${escapeHTML(platform)} &nbsp;·&nbsp; <strong style="color:#161821;">Battery:</strong> ${escapeHTML(battery)}
              </td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:18px 30px 2px;color:#30333d;font-size:16px;line-height:1.72;">
          <p style="margin:0 0 16px;">A quick, honest note before you buy: the “best” watch is usually not the one with the longest feature list. It is the one that still feels right on your wrist after two weeks, records your normal routes accurately, and does not force you into charging habits you hate.</p>
          <p style="margin:0 0 16px;">So when you open the report, look at these three sections first:</p>
          <ol style="margin:0 0 18px 22px;padding:0;">
            <li style="margin-bottom:8px;"><strong>Case fit.</strong> If your wrist is small, size and lug shape matter more than almost any sensor.</li>
            <li style="margin-bottom:8px;"><strong>GPS mode.</strong> Trail, city, and cycling users should care about multi-band/all-systems GPS.</li>
            <li style="margin-bottom:8px;"><strong>Real battery.</strong> Always-on display, SpO2, music, and GPS can cut marketing claims in half.</li>
          </ol>
        </td></tr>
        <tr><td align="center" style="padding:20px 30px 10px;">
          <a href="${escapeAttr(url)}" style="display:inline-block;background:#ff3b6b;color:#ffffff;text-decoration:none;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:15px 26px;border-radius:10px;font-size:14px;box-shadow:0 12px 30px rgba(255,59,107,.22);">Open my WatchMatch report</a>
          <div style="margin-top:12px;color:#777d8a;font-size:12px;line-height:1.5;">If the button does not open, copy this link:<br><a href="${escapeAttr(url)}" style="color:#ff3b6b;text-decoration:underline;word-break:break-all;">${escapeHTML(url)}</a></div>
        </td></tr>
        <tr><td style="padding:22px 30px 8px;">
          <div style="border-top:1px solid #eceef3;padding-top:20px;">
            <div style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#6b7280;font-weight:800;margin-bottom:10px;">What I’ll send next</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td style="padding:9px 0;color:#30333d;font-size:14px;line-height:1.55;"><strong>Day 2:</strong> platform lock-in — what iPhone and Android users should avoid.</td></tr>
              <tr><td style="padding:9px 0;color:#30333d;font-size:14px;line-height:1.55;border-top:1px solid #f0f1f4;"><strong>Day 4:</strong> real battery math — the number brands do not put on the box.</td></tr>
              <tr><td style="padding:9px 0;color:#30333d;font-size:14px;line-height:1.55;border-top:1px solid #f0f1f4;"><strong>Day 6:</strong> the sensors that matter, and the ones you should not overpay for.</td></tr>
              <tr><td style="padding:9px 0;color:#30333d;font-size:14px;line-height:1.55;border-top:1px solid #f0f1f4;"><strong>Later:</strong> alternates, setup tips, and accessories that are actually worth it.</td></tr>
            </table>
          </div>
        </td></tr>
        <tr><td style="padding:18px 30px 28px;color:#525866;font-size:15px;line-height:1.7;">
          <p style="margin:0 0 12px;">If you are torn between two models, reply with the names. I’ll tell you which one I’d buy and why — no script, no generic answer.</p>
          <p style="margin:0;color:#17191f;font-weight:700;">Alex<br><span style="font-weight:500;color:#6b7280;">GearUpToFit</span></p>
        </td></tr>
        <tr><td style="padding:16px 30px 24px;background:#fbfbfd;color:#7b8190;font-size:12px;line-height:1.6;border-top:1px solid #eceef3;">
          You are receiving this because you requested your WatchMatch report on GearUpToFit. If this is not useful, use Brevo’s unsubscribe link or reply with “stop” and we will remove you.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
  return { subject, html, text };
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