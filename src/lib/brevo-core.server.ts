import { z } from "zod";

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

export const brevoSubscribeSchema = z.object({
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
  topMatchBrand: z.string().max(100).optional(),
  topMatchModel: z.string().max(150).optional(),
  category: z.string().max(120).optional(),
  phoneOS: z.string().max(20).optional(),
  batteryPref: z.coerce.number().int().min(0).max(120).optional(),
  watchMatchURL: z.string().url().max(2048).optional(),
  utm: utmSchema,
});

export type BrevoSubscribeInput = z.infer<typeof brevoSubscribeSchema>;

const PUBLIC_APP_ORIGIN = "https://wrist-wonderland-hub.lovable.app";
const BREVO_GATEWAY_URL = "https://connector-gateway.lovable.dev/brevo";
const BREVO_API_URL = "https://api.brevo.com/v3";
const REQUEST_TIMEOUT_MS = 12_000;

function listIdFor(source: BrevoSubscribeInput["source"]): number {
  const env = process.env.BREVO_LIST_ID_QUIZ_GATE ?? process.env.BREVO_LIST_ID ?? "1";
  const fallback = parseInt(env, 10) || 1;
  const map: Record<BrevoSubscribeInput["source"], number> = {
    quiz_gate: parseInt(process.env.BREVO_LIST_ID_QUIZ_GATE ?? "", 10) || fallback,
    exit_popup: parseInt(process.env.BREVO_LIST_ID_EXIT_POPUP ?? "", 10) || fallback,
    inline_hero: parseInt(process.env.BREVO_LIST_ID_INLINE_HERO ?? "", 10) || fallback,
    footer: parseInt(process.env.BREVO_LIST_ID_FOOTER ?? "", 10) || fallback,
    blog_inline: parseInt(process.env.BREVO_LIST_ID_BLOG_INLINE ?? "", 10) || fallback,
  };
  return map[source];
}

const senderName = () => process.env.BREVO_SENDER_NAME ?? "GearUpToFit · WatchMatch AI";
const senderEmail = () => process.env.BREVO_SENDER_EMAIL ?? "info@gearuptofit.com";

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

function escapeHTML(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&#39;",
  );
}

function brevoHeaders(apiKey: string): HeadersInit {
  const lovableApiKey = process.env.LOVABLE_API_KEY;
  if (lovableApiKey) {
    return {
      Authorization: `Bearer ${lovableApiKey}`,
      "X-Connection-Api-Key": apiKey,
      "content-type": "application/json",
      accept: "application/json",
    };
  }
  return { "api-key": apiKey, "content-type": "application/json", accept: "application/json" };
}

async function postBrevo(path: string, body: unknown, apiKey: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const lovableApiKey = process.env.LOVABLE_API_KEY;
  const url = lovableApiKey ? `${BREVO_GATEWAY_URL}${path}` : `${BREVO_API_URL}${path}`;

  try {
    return await fetch(url, {
      method: "POST",
      headers: brevoHeaders(apiKey),
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function welcomeHTML(input: BrevoSubscribeInput) {
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

Open your report: ${url}

Before you decide, check three things in the report: case fit on your wrist, real GPS mode for your routes, and battery with the features you actually keep on.

Reply if you want me to sanity-check a model before you buy.

Alex
GearUpToFit`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHTML(subject)}</title></head>
<body style="margin:0;background:#f5f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#17191f;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f6f8;padding:28px 14px;"><tr><td align="center">
<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="width:100%;max-width:640px;background:#fff;border:1px solid #e6e8ee;border-radius:18px;overflow:hidden;box-shadow:0 18px 60px rgba(17,24,39,.08);">
<tr><td style="background:#11131a;padding:28px 30px 24px;">
<div style="font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:#ff4f75;font-weight:800;">GearUpToFit · WatchMatch AI</div>
<h1 style="margin:14px 0 10px;font-size:30px;line-height:1.12;color:#fff;font-weight:800;letter-spacing:-.02em;">Hi ${escapeHTML(name)} — your watch report is ready.</h1>
<p style="margin:0;color:#c9cbd3;font-size:16px;line-height:1.6;">Built around how you said you'll actually use the watch — not the loudest spec sheet.</p>
</td></tr>
<tr><td style="padding:26px 30px 10px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eceef3;border-radius:14px;overflow:hidden;">
<tr><td style="padding:18px 20px;background:#fbfbfd;">
<div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#6b7280;font-weight:800;margin-bottom:7px;">Your top match</div>
<div style="font-size:24px;line-height:1.2;font-weight:800;color:#161821;">${escapeHTML(matchName)}</div>
</td></tr>
<tr><td style="padding:15px 20px;background:#fff;border-top:1px solid #eceef3;color:#4b5563;font-size:14px;line-height:1.65;">
<strong style="color:#161821;">Profile:</strong> ${escapeHTML(category)} &nbsp;·&nbsp; <strong style="color:#161821;">Phone:</strong> ${escapeHTML(platform)} &nbsp;·&nbsp; <strong style="color:#161821;">Battery:</strong> ${escapeHTML(battery)}
</td></tr></table></td></tr>
<tr><td align="center" style="padding:22px 30px 10px;">
<a href="${escapeHTML(url)}" style="display:inline-block;background:#ff3b6b;color:#fff;text-decoration:none;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:15px 26px;border-radius:10px;font-size:14px;box-shadow:0 12px 30px rgba(255,59,107,.22);">Open my WatchMatch report</a>
<div style="margin-top:12px;color:#777d8a;font-size:12px;">Or copy: <a href="${escapeHTML(url)}" style="color:#ff3b6b;">${escapeHTML(url)}</a></div>
</td></tr>
<tr><td style="padding:18px 30px 28px;color:#525866;font-size:15px;line-height:1.7;">
<p style="margin:0 0 12px;">Reply with two models you're torn between and I'll tell you which one I'd buy and why.</p>
<p style="margin:0;color:#17191f;font-weight:700;">Alex<br><span style="font-weight:500;color:#6b7280;">GearUpToFit</span></p>
</td></tr></table></td></tr></table></body></html>`;
  return { subject, html, text };
}

export type SubscribeResult =
  | { success: true; welcomeSent: boolean }
  | { success: false; error: string };

export async function runBrevoSubscribe(data: BrevoSubscribeInput): Promise<SubscribeResult> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return { success: false, error: "Email service not configured" };
  }

  const reportURL = normalizeReportURL(data.watchMatchURL);
  const attributes: Record<string, unknown> = {
    FIRSTNAME: data.firstName ?? "",
    SOURCE: data.source,
    TOP_MATCH_BRAND: data.topMatchBrand ?? "",
    TOP_MATCH_MODEL: data.topMatchModel ?? "",
    WATCH_CATEGORY: data.category ?? "",
    PHONE_OS: data.phoneOS ?? "",
    BATTERY_PREF_DAYS: data.batteryPref ?? null,
    WATCHMATCH_URL: reportURL,
    UTM_SOURCE: data.utm?.source ?? "",
    UTM_MEDIUM: data.utm?.medium ?? "",
    UTM_CAMPAIGN: data.utm?.campaign ?? "",
    REFERRER: data.utm?.referrer ?? "",
    OPT_IN_DATE: new Date().toISOString(),
  };

  try {
    const upsertRes = await postBrevo(
      "/contacts",
      {
        email: data.email,
        attributes,
        listIds: [listIdFor(data.source)],
        updateEnabled: true,
      },
      apiKey,
    );
    const txt = await upsertRes.text();
    let json: unknown = null;
    try { json = txt ? JSON.parse(txt) : null; } catch { /* ignore */ }
    const duplicateOk = json && typeof json === "object" && (json as { code?: string }).code === "duplicate_parameter";
    if (!upsertRes.ok && !duplicateOk) {
      console.error("brevo upsert failed", upsertRes.status, txt);
      return { success: false, error: "Subscription failed. Please try again." };
    }
  } catch (err) {
    console.error("brevo upsert exception", err);
    return { success: false, error: "Network error contacting email service" };
  }

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
        FIRSTNAME: data.firstName || "there",
        TOP_MATCH_BRAND: data.topMatchBrand || "",
        TOP_MATCH_MODEL: data.topMatchModel || "",
        WATCH_CATEGORY: data.category || "",
        WATCHMATCH_URL: reportURL,
      };
    } else {
      const { subject, html, text } = welcomeHTML({ ...data, watchMatchURL: reportURL });
      sendBody.subject = subject;
      sendBody.htmlContent = html;
      sendBody.textContent = text;
    }
    const sendRes = await postBrevo("/smtp/email", sendBody, apiKey);
    welcomeSent = sendRes.ok;
    if (!sendRes.ok) {
      const errTxt = await sendRes.text();
      console.error("brevo welcome send failed", sendRes.status, errTxt);
    }
  } catch (err) {
    console.error("brevo welcome send exception", err);
  }

  return { success: true, welcomeSent };
}
