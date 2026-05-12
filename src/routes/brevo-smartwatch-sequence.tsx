import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  ClipboardCopy,
  Mail,
  Workflow,
  Tags,
  Timer,
  Server,
  Code2,
  Target,
  GitBranch,
  ShieldCheck,
  BarChart3,
  Beaker,
  Layers,
} from "lucide-react";

export const Route = createFileRoute("/brevo-smartwatch-sequence")({
  head: () => ({
    meta: [
      { title: "GearUpToFit Smartwatch Email Sequence (Brevo + WordPress)" },
      {
        name: "description",
        content:
          "An 8-email, human-written Brevo nurture sequence for smartwatches, sport watches and fitness bands — built for the official Brevo WordPress plugin on gearuptofit.com.",
      },
      { property: "og:title", content: "GearUpToFit Smartwatch Email Sequence" },
      {
        property: "og:description",
        content:
          "Premium Brevo email sequence + WordPress integration plan + reverse-proxy embedding guide for /watch-match/.",
      },
    ],
    links: [{ rel: "canonical", href: "https://gearuptofit.com/brevo-smartwatch-sequence/" }],
  }),
  component: BrevoSmartwatchSequence,
});

type EmailStep = {
  day: string;
  subject: string;
  preheader: string;
  goal: string;
  body: string;
  cta: string;
  url: string;
  brevoRule: string;
};

const G = (p: string) => `https://gearuptofit.com/${p.replace(/^\//, "")}`;

const emails: EmailStep[] = [
  {
    day: "Immediately (T+0)",
    subject: "Your WatchMatch result — plus the one spec most people get wrong",
    preheader: "Open this before you buy. A 90-second read that will save you a return.",
    goal: "Deliver the promise (their match), set the relationship tone, route them back to the result page.",
    body: `Hi {{ contact.FIRSTNAME | default: "there" }},

Thanks for trusting GearUpToFit to help you choose your next watch.

Your top match was the {{ contact.TOP_MATCH_BRAND }} {{ contact.TOP_MATCH_MODEL }} — based on your sport, phone, wrist size and battery preference.

Before you click "buy", one quick warning. The single spec most buyers regret ignoring is not battery life, screen size, or sensors. It is **GPS architecture**. A watch with single-frequency GPS will drift 30–80m on tree-lined trails or city blocks. Multi-band (L1+L5) holds within 5m. If you run, hike, or cycle outside a track, this is the spec that decides whether your splits are real.

If your match has multi-band, you're set. If not, I sent you a near-equivalent in the result page that does — scroll to "Alternate Pick".

When you're ready, your full personalized recommendation is here:

{{ contact.WATCHMATCH_URL }}

Talk soon,
Alex
GearUpToFit.com

P.S. If your wrist is under 160 mm, look at the case-size note in your result. A 49 mm case on a 150 mm wrist is the second most common return reason after GPS disappointment.`,
    cta: "View my full WatchMatch result",
    url: "{{ contact.WATCHMATCH_URL }}",
    brevoRule:
      "Trigger: form submission on /watch-match/ result page. Save TOP_MATCH_BRAND, TOP_MATCH_MODEL, WATCHMATCH_URL, PRIMARY_USE, PHONE_OS, BUDGET_BAND as Brevo contact attributes via the Brevo WP plugin's Form mapping.",
  },
  {
    day: "Day 2",
    subject: "iPhone vs Android: the watch decision that locks you in for years",
    preheader: "If you switch phones, your watch may not come with you. Read this first.",
    goal: "Educate on platform lock-in; segment by PHONE_OS for future emails.",
    body: `Quick one today.

Apple Watch only pairs with iPhone. Galaxy Watch (Wear OS) needs Android for full features (calls, ECG, Samsung Pay). Garmin, Coros, Polar, Suunto, Fitbit and Amazfit work with both.

If you might switch phone platforms in the next 2–3 years, lean toward a cross-platform brand. If you're settled — Apple or Samsung gives you the deepest integration (notifications, contactless pay, voice assistant).

Three reads that will save you guesswork:
- Apple Watch vs Garmin (the real-world comparison): ${G("review/apple-watch-vs-garmin")}
- Best smartwatches for Android: ${G("review/best-smartwatches-for-android")}
- Best smartwatches for iPhone: ${G("review/best-smartwatches-for-iphone")}

If your match was an Apple Watch and you have an Android, hit reply — I'll re-run your profile.

Alex`,
    cta: "See platform-specific picks",
    url: G("review/apple-watch-vs-garmin"),
    brevoRule:
      "Conditional content block: if PHONE_OS = iphone, surface Apple-side guides; if android, Samsung/Garmin guides. Save click on either link as a 'platform_engaged' event.",
  },
  {
    day: "Day 4",
    subject: "Battery life is lying to you (here is the real number)",
    preheader: "Why a '14-day' watch lasts 4 days in real use — and how to plan around it.",
    goal: "Build credibility through a contrarian, technically-honest take.",
    body: `Manufacturer battery numbers are technically true and practically useless.

A "14-day" smartwatch number assumes: GPS off, always-on display off, SpO2 off, music off, screen brightness 30%, no third-party apps, light notifications.

Turn on multi-band GPS for a long run? That same watch drains in 24–36 hours. Always-on AMOLED? Halve everything.

Here is the honest table to use when you compare:

- Apple Watch Ultra 2: 36 h normal, 12 h GPS, 60 h low-power
- Garmin Fenix 8 (47 mm AMOLED): 16 days smart, 32 h GPS multi-band
- Garmin Instinct 3 Solar: 24+ days smart, 32 h GPS
- Coros Vertix 2S: 40 days smart, 118 h GPS
- Apple Watch Series 10: 18 h normal, 36 h low-power
- Galaxy Watch Ultra: 60 h normal, 14 h GPS

Read the full battery deep-dive: ${G("review/best-smartwatches-with-long-battery-life")}

Alex`,
    cta: "Compare real-world battery",
    url: G("review/best-smartwatches-with-long-battery-life"),
    brevoRule:
      "If contact opens this email but does not click within 48h, send a one-line follow-up: 'Did the battery numbers help — anything I can clarify?'",
  },
  {
    day: "Day 6",
    subject: "ECG, SpO2, body composition — which sensors actually change how you train",
    preheader: "Three sensors are useful. The rest are nice-to-have. Here is the breakdown.",
    goal: "Reduce decision paralysis on health features; route to specific guides.",
    body: `Modern watches now ship with 8–12 sensors. Most are noise. These three actually matter:

1. **Optical HR + HRV.** Drives training load, recovery scores, and Zone 2 accuracy. Garmin, Polar and Apple are class-leading.
2. **ECG (single lead).** Detects atrial fibrillation. Worth it if you are 50+, hypertensive, or have a family history. Apple, Samsung, Garmin Venu 3 and Withings ScanWatch all offer it.
3. **Multi-band GNSS.** Discussed in email 1 — this is the sport sensor that changes data quality.

The rest (SpO2, skin temperature, body composition, EDA) are useful as trends, unreliable as absolutes. Do not pay a $100+ premium for them alone.

If health is your priority, start here:
- Best smartwatches with ECG: ${G("review/best-smartwatches-with-ecg")}
- Best smartwatches for seniors: ${G("review/best-smartwatches-for-seniors")}
- Best smartwatches for blood pressure: ${G("review/best-smartwatches-with-blood-pressure-monitor")}

Alex`,
    cta: "See sensor-by-sensor picks",
    url: G("review/best-smartwatches-with-ecg"),
    brevoRule:
      "If contact clicks an ECG/health link, tag 'health_focus' and prioritize health-leaning content in later emails.",
  },
  {
    day: "Day 9",
    subject: "Sport watch vs smartwatch vs band — the 30-second decision tree",
    preheader: "Stop comparing categories that solve different problems.",
    goal: "Reframe the buying question; reduce returns.",
    body: `If you remember nothing else, remember this:

- **Smartwatch** = phone-on-your-wrist + fitness. Daily charging. Best for everyday users who train 3–5 h/week.
- **Sport watch** = built-for-athletes. 1–4 weeks battery, MIP or AMOLED, advanced training metrics, rugged. Best for runners, cyclists, triathletes, hikers.
- **Fitness band** = activity + sleep + HR. Multi-day battery, slim, $40–$200. Best for habit-building, budget, or as a second device.
- **Hybrid** = analog look, smart inside. Long battery, low feature surface. Best for office and discreet wear.

If you train more than 8 h/week or do long endurance, you will outgrow a pure smartwatch within a year. Plan for that now.

Re-take the quiz with new answers any time: https://gearuptofit.com/watch-match/

Alex`,
    cta: "Re-run my WatchMatch",
    url: "https://gearuptofit.com/watch-match/",
    brevoRule:
      "Suppress this email if BUDGET_BAND = under-100 (band buyer) — send the budget-band variant instead.",
  },
  {
    day: "Day 12",
    subject: "{{ contact.FIRSTNAME | default: \"Hey\" }}, did you pick one yet?",
    preheader: "If something is holding you back, hit reply. Real human, real reply.",
    goal: "Re-engage; surface objections; offer 1:1 help (high trust).",
    body: `Just checking in.

If you bought your match — congrats, hit reply and let me know how it feels week one. I'd love to hear.

If you didn't, the three things that usually stop people are:

1. Price — I can almost always find you a near-equivalent at a lower price.
2. Looks — every brand now ships at least 3 case sizes and dozens of bands.
3. "What if I switch sports" — most modern watches cover 30–100 activity profiles.

Reply with which one and I'll send you a tailored shortlist. No script.

Alex
(yes, real reply, real inbox)`,
    cta: "Reply to this email",
    url: "mailto:hello@gearuptofit.com",
    brevoRule:
      "Set Reply-To: a real monitored inbox. Mark this email as 'high-value' in Brevo so replies notify the team in real time.",
  },
  {
    day: "Day 16",
    subject: "Your watch will be obsolete in 4 years. Here's why that's fine.",
    preheader: "How to think about the 'should I wait for next year's model' question.",
    goal: "Defuse the wait-for-next-year objection; create urgency without being pushy.",
    body: `If you wait for next year's model, you will wait forever. Here is the honest cycle:

- Apple Watch: meaningful upgrade every 2 years (S6→S8, S8→S10).
- Garmin Fenix / Forerunner: meaningful upgrade every 3 years.
- Samsung Galaxy Watch: meaningful upgrade every 2 years.
- Coros: meaningful upgrade every 2–3 years.

If your current watch is 3+ years old (or you don't have one), the gap is now real: multi-band GPS, AMOLED, faster charging, on-device AI insights, longer battery, much better sleep tracking.

If your watch is 1–2 years old, wait. Skip a generation.

Browse current-gen flagships: ${G("review/best-smartwatches-of-the-year")}

Alex`,
    cta: "See current flagships",
    url: G("review/best-smartwatches-of-the-year"),
    brevoRule:
      "If contact has not clicked any link by this point, lower send frequency to weekly newsletter only after email 8.",
  },
  {
    day: "Day 21",
    subject: "Last one: the GearUpToFit weekly — opt in if you want to keep going",
    preheader: "You'll stop hearing from me on watches unless you say yes here.",
    goal: "Clean transition to the long-term newsletter list. Permission, not assumption.",
    body: `This is the last email in your watch series.

You either bought, you're still thinking, or this isn't your time. All three are fine.

If you'd like to keep getting one helpful email a week from GearUpToFit — covering smartwatches, running, training, recovery and gear — just click the button below to confirm.

If you don't, I'll move you off the watch list and stop emailing. No hard feelings.

Thanks for letting me help you think through this.

Alex
GearUpToFit.com`,
    cta: "Yes, keep me on the weekly newsletter",
    url: "https://gearuptofit.com/newsletter/?confirm=1",
    brevoRule:
      "Final email. If contact does NOT click the confirm link within 14 days, move to a quarterly low-frequency segment. Respect the choice — do not auto-resubscribe.",
  },
];

const setupSteps = [
  {
    title: "1. Install the official Brevo WordPress plugin",
    detail:
      "WordPress admin → Plugins → Add New → search 'Brevo' → install and activate the official 'Brevo (formerly Sendinblue)' plugin. Connect it with your Brevo API v3 key from Brevo → SMTP & API → API Keys.",
  },
  {
    title: "2. Create the contact list and attributes",
    detail:
      "In Brevo: Contacts → Lists → New: 'Smartwatch — WatchMatch'. Then Settings → Contact Attributes, add: TOP_MATCH_BRAND (text), TOP_MATCH_MODEL (text), WATCHMATCH_URL (text), PRIMARY_USE (text), PHONE_OS (text), BUDGET_BAND (text).",
  },
  {
    title: "3. Wire the WatchMatch result page to Brevo",
    detail:
      "On the /watch-match/ result page, the email opt-in form posts to the Brevo plugin's REST endpoint with the 6 hidden fields above auto-filled from the result. The plugin maps form fields → contact attributes and adds the contact to the 'Smartwatch — WatchMatch' list.",
  },
  {
    title: "4. Build the automation in Brevo",
    detail:
      "Brevo → Automations → New scenario → Entry point: 'Contact added to a list' → 'Smartwatch — WatchMatch'. Add 8 'Send an email' steps with the day-offsets above (T+0, T+2, T+4, T+6, T+9, T+12, T+16, T+21). Use the email bodies below as templates with merge tags.",
  },
  {
    title: "5. Add a goal & exit condition",
    detail:
      "Set 'Goal: Click on link to amazon.com' so converters drop out of the sequence automatically. Add an exit condition: 'If contact unsubscribes OR has not opened 3 in a row, stop the workflow'.",
  },
];

function BrevoSmartwatchSequence() {
  const [copiedAll, setCopiedAll] = useState(false);

  const fullText = useMemo(
    () =>
      emails
        .map(
          (e, i) =>
            `=== EMAIL ${i + 1} — ${e.day} ===
Subject: ${e.subject}
Preheader: ${e.preheader}
Goal: ${e.goal}

${e.body}

CTA: ${e.cta}
URL: ${e.url}

[Brevo automation rule]
${e.brevoRule}
`
        )
        .join("\n\n"),
    []
  );

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 1800);
    } catch {
      /* noop */
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dark text-foreground">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-10 md:py-16 space-y-10">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Badge className="bg-primary/15 text-primary border-primary/25 uppercase tracking-widest text-[10px]">
            Brevo + WordPress · Smartwatch nurture
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">
            The GearUpToFit Smartwatch Email Sequence
          </h1>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            8 human-written emails, sent over 21 days, written for the official
            Brevo WordPress plugin. Built for smartwatch, sport watch and fitness
            band buyers — and for the broader GearUpToFit audience.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button onClick={copyAll} className="bg-gradient-primary glow-primary-sm font-bold uppercase tracking-wider text-xs">
              <ClipboardCopy className="w-4 h-4 mr-2" />
              {copiedAll ? "Copied!" : "Copy full sequence"}
            </Button>
            <a
              href="https://app.brevo.com/automation/scenarios"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-primary/30 hover:bg-primary/10 px-5 h-11 rounded-xl font-bold uppercase tracking-wider text-xs text-primary transition-all"
            >
              <Workflow className="w-4 h-4" />
              Open Brevo Automations
            </a>
          </div>
        </motion.header>

        {/* Embedding / reverse-proxy */}
        <section className="glass rounded-2xl p-5 md:p-8 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Server className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold uppercase tracking-tight">
              Embed at gearuptofit.com/watch-match/ (reverse proxy)
            </h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Goal: serve this app at the canonical URL{" "}
            <code className="text-primary">https://gearuptofit.com/watch-match/</code>{" "}
            so SEO authority, internal links, and analytics stay on the
            GearUpToFit domain. Pick the snippet for your stack.
          </p>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-primary" /> Nginx (Cloudways, Kinsta, self-hosted)
              </h3>
              <pre className="text-[11px] md:text-xs bg-card/60 border border-border/40 rounded-lg p-3 overflow-x-auto leading-relaxed">{`location ^~ /watch-match/ {
  proxy_pass         https://wrist-wonderland-hub.lovable.app/watch-match/;
  proxy_ssl_server_name on;
  proxy_set_header   Host wrist-wonderland-hub.lovable.app;
  proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
  proxy_set_header   X-Forwarded-Proto $scheme;
  proxy_set_header   X-Forwarded-Host  $host;
  proxy_redirect     off;
}
location ^~ /_build/ {
  proxy_pass         https://wrist-wonderland-hub.lovable.app/_build/;
  proxy_set_header   Host wrist-wonderland-hub.lovable.app;
}`}</pre>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-primary" /> Cloudflare Workers (recommended)
              </h3>
              <pre className="text-[11px] md:text-xs bg-card/60 border border-border/40 rounded-lg p-3 overflow-x-auto leading-relaxed">{`export default {
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname.startsWith("/watch-match") || url.pathname.startsWith("/_build")) {
      const upstream = new URL(url.pathname + url.search,
        "https://wrist-wonderland-hub.lovable.app");
      return fetch(upstream, { method: req.method, headers: req.headers, body: req.body });
    }
    return fetch(req);
  }
}`}</pre>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-primary" /> Apache (.htaccess) fallback
              </h3>
              <pre className="text-[11px] md:text-xs bg-card/60 border border-border/40 rounded-lg p-3 overflow-x-auto leading-relaxed">{`RewriteEngine On
RewriteRule ^watch-match/(.*)$ https://wrist-wonderland-hub.lovable.app/watch-match/$1 [P,L]
RewriteRule ^_build/(.*)$ https://wrist-wonderland-hub.lovable.app/_build/$1 [P,L]`}</pre>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Canonical tags in the app already point to{" "}
            <code className="text-primary">gearuptofit.com/watch-match/</code> so
            Google consolidates ranking signals on your domain.
          </p>
        </section>

        {/* Setup steps */}
        <section className="glass rounded-2xl p-5 md:p-8 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Tags className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold uppercase tracking-tight">
              Brevo + WordPress setup (15 minutes)
            </h2>
          </div>
          <ol className="space-y-3">
            {setupSteps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-sm md:text-base">{s.title}</div>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed mt-1">
                    {s.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Email sequence */}
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold uppercase tracking-tight">
              The 8-email sequence
            </h2>
          </div>
          <div className="space-y-4">
            {emails.map((e, i) => (
              <motion.article
                key={i}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="glass rounded-2xl p-5 md:p-6 space-y-3"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <Badge className="border-primary/25 bg-primary/10 text-primary uppercase tracking-widest text-[10px]">
                    Email {i + 1}
                  </Badge>
                  <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                    <Timer className="w-3.5 h-3.5" />
                    {e.day}
                  </span>
                </div>
                <h3 className="text-lg md:text-xl font-bold leading-snug">
                  {e.subject}
                </h3>
                <p className="text-xs text-muted-foreground italic">
                  Preheader: {e.preheader}
                </p>
                <p className="text-xs text-primary/80">Goal: {e.goal}</p>
                <pre className="whitespace-pre-wrap text-sm text-foreground/90 leading-relaxed bg-card/40 border border-border/40 rounded-lg p-4 font-sans">
                  {e.body}
                </pre>
                <div className="text-xs text-muted-foreground">
                  <strong className="text-primary">CTA:</strong> {e.cta} →{" "}
                  <code className="text-primary/80">{e.url}</code>
                </div>
                <div className="text-xs text-muted-foreground border-t border-border/40 pt-3">
                  <strong className="text-primary">Brevo rule:</strong> {e.brevoRule}
                </div>
              </motion.article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
