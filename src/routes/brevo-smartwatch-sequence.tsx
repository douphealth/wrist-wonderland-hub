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

// Post-purchase lifecycle (triggered when 'amazon_click' goal fires OR contact self-reports 'I bought it')
const lifecycleEmails: EmailStep[] = [
  {
    day: "Day 30 post-purchase",
    subject: "Your first 30 days with the {{ contact.TOP_MATCH_MODEL }} — three settings to change tonight",
    preheader: "Default settings are conservative. These three unlock the watch you actually paid for.",
    goal: "Activation. Drive deeper feature use → higher retention, fewer returns, more affiliate trust.",
    body: `You've had it a month. Here are the three settings 90% of buyers never touch — and that change the experience the most:

1. **GPS mode → Multi-band / All-Systems**. Default is usually 'Auto'. Force it on for outdoor workouts.
2. **HR broadcast over BLE**. Lets your watch act as a chest-strap replacement for Zwift, Peloton, gym bikes.
3. **Sleep window + Do Not Disturb sync**. Massive accuracy jump on sleep stages and recovery.

Full setup checklist for your model: ${G("review/" + "{{ contact.TOP_MATCH_SLUG }}-setup")}

Alex`,
    cta: "Open the setup checklist",
    url: G("review/best-smartwatches-of-the-year"),
    brevoRule:
      "Trigger: contact has tag 'purchased' OR amazon_click event > 0. Wait 30 days from event. Skip if contact unsubscribed.",
  },
  {
    day: "Day 60 post-purchase",
    subject: "The 4 accessories actually worth buying (and the 9 that aren't)",
    preheader: "Bands, chargers, screen protectors — what's worth it, what's a waste.",
    goal: "Accessory revenue + practical value. Position GearUpToFit as the trusted post-purchase advisor.",
    body: `Worth it:
- A second band in silicone (sweat) + a nylon/leather (office). $15–30 each.
- A genuine OEM fast charger for travel. $20–40.
- A tempered-glass screen protector if you have AMOLED. $8–15.
- A chest HR strap (Polar H10 or Garmin HRM-Pro) if you do intervals. $80.

Not worth it: third-party "cradle" chargers, $5 bands that stain skin, sapphire screen "upgrades", magnetic clasps that pop off mid-run, USB cable extenders, novelty cases.

Full accessory guide: ${G("review/best-smartwatch-accessories")}

Alex`,
    cta: "See the accessory guide",
    url: G("review/best-smartwatch-accessories"),
    brevoRule:
      "Wait 60 days from purchase event. A/B test subject line variant: 'Stop wasting money on smartwatch accessories'.",
  },
  {
    day: "Day 120 post-purchase",
    subject: "Quick favor — would you leave a 1-line review?",
    preheader: "It helps other readers more than you'd think. 30 seconds, totally optional.",
    goal: "User-generated content for review pages → SEO + social proof loop.",
    body: `You've had your watch ~4 months — long enough to know the truth.

If you have 30 seconds, hit reply with one line: what you love, what annoys you, would you buy it again?

I publish reader quotes (first name only) on the review page. It's the single most-trusted thing on the page — way more than my own writing.

No reply needed if you're not into it. Either way, thanks for reading.

Alex`,
    cta: "Reply with one line",
    url: "mailto:hello@gearuptofit.com?subject=My%20watch%20review",
    brevoRule:
      "Wait 120 days from purchase. Tag replies with 'ugc_submitted'. Reply-to must be monitored. Single send — do not nag.",
  },
  {
    day: "Month 12 post-purchase",
    subject: "One year in — should you upgrade, or wait?",
    preheader: "An honest framework. Most years, the answer is wait.",
    goal: "Re-engagement at the natural upgrade moment. High-intent affiliate window without being pushy.",
    body: `You've owned your {{ contact.TOP_MATCH_MODEL }} for a year. The honest upgrade test:

- Battery still holds 80%+ of day-1? → Keep it.
- New model adds multi-band GPS / AMOLED / 2x battery your watch lacks? → Upgrade is real.
- New model is just a faster chip + new band colors? → Skip.

If you're due, your re-take of WatchMatch is here (it remembers your last answers): https://gearuptofit.com/watch-match/

If you're keeping it, here's the squeeze-more-life-out-of-it guide: ${G("review/extend-smartwatch-life")}

Alex`,
    cta: "Re-run WatchMatch",
    url: "https://gearuptofit.com/watch-match/",
    brevoRule:
      "Wait 365 days. Suppress if contact already entered a new WatchMatch session in the last 60 days. Annual cadence — repeat each year while contact is engaged.",
  },
];

const segmentationMatrix = [
  { segment: "iPhone + Endurance + 500+", primary: "Apple Watch Ultra 2", swap: ["Garmin Fenix 8 AMOLED 47", "Coros Vertix 2S"], cadence: "Standard 8-step + post-purchase" },
  { segment: "Android + Endurance + 500+", primary: "Garmin Fenix 8 AMOLED 47", swap: ["Coros Vertix 2S", "Suunto Vertical"], cadence: "Standard 8-step, swap email 2 to Android-first" },
  { segment: "iPhone + Daily + 250–500", primary: "Apple Watch Series 10", swap: ["Apple Watch SE 3", "Galaxy Watch 7"], cadence: "Standard, emphasize ecosystem in email 2" },
  { segment: "Android + Daily + 250–500", primary: "Galaxy Watch Ultra", swap: ["Pixel Watch 3", "Galaxy Watch 7"], cadence: "Standard, emphasize Wear OS in email 2" },
  { segment: "Any + Band + <100", primary: "Xiaomi Smart Band 9", swap: ["Fitbit Inspire 3", "Amazfit Bip 5"], cadence: "Skip email 5 (sport-watch reframe), use band variant" },
  { segment: "Any + Health-first + 250–500", primary: "Withings ScanWatch 2", swap: ["Garmin Venu 3", "Apple Watch Series 10"], cadence: "Tag 'health_focus', prioritize ECG/sleep guides" },
];

const kpiBenchmarks = [
  { metric: "Open rate (email 1)", target: "55–70%", floor: "<40% triggers subject-line A/B", note: "Highest-intent moment in the journey" },
  { metric: "Open rate (avg 2–8)", target: "32–45%", floor: "<22% review send time + from-name", note: "Industry avg ~21% (Mailchimp 2024)" },
  { metric: "Click-through rate", target: "5–9%", floor: "<2.5% review CTA placement", note: "Affiliate vertical benchmark ~2.6%" },
  { metric: "Amazon goal (purchase click)", target: "8–14%", floor: "<5%", note: "Tracked via Brevo goal on amazon.com link" },
  { metric: "Unsubscribe rate", target: "<0.5% per email", floor: ">1.0% pause sequence", note: "Healthy long-term list signal" },
  { metric: "Spam complaint rate", target: "<0.08%", floor: ">0.1% Gmail postmaster alert", note: "Postmaster Tools must be wired" },
  { metric: "Bounce rate", target: "<2% hard bounce", floor: ">5% audit list hygiene", note: "Use Brevo's auto-suppression" },
  { metric: "Sequence completion", target: "60–75%", floor: "<45%", note: "Drop-off concentrated around email 5" },
];

const abTests = [
  { id: "T1", element: "Email 1 subject", a: "Your WatchMatch result — plus the one spec most people get wrong", b: "Don't buy your watch yet ({{ contact.TOP_MATCH_MODEL }} included)", winnerMetric: "Open rate, 24h", traffic: "50/50, min 1,000 sends" },
  { id: "T2", element: "Email 3 send time", a: "Tue 09:00 local (Brevo send-time optimization)", b: "Sun 18:00 local", winnerMetric: "Open + CTR composite", traffic: "50/50, 2-week window" },
  { id: "T3", element: "Email 4 CTA", a: "Single button: 'See sensor-by-sensor picks'", b: "Three inline links to ECG / senior / BP guides", winnerMetric: "CTR per recipient", traffic: "50/50, 1,500 sends" },
  { id: "T4", element: "From name", a: "Alex from GearUpToFit", b: "GearUpToFit", winnerMetric: "Open rate across full sequence", traffic: "Hold-out 20%" },
  { id: "T5", element: "Email 6 personalization depth", a: "Generic check-in", b: "Reference TOP_MATCH_BRAND and PRIMARY_USE", winnerMetric: "Reply rate", traffic: "50/50" },
];

const deliverabilityChecklist = [
  "SPF, DKIM and DMARC published for gearuptofit.com (DMARC at p=quarantine, ramp to p=reject after 30d clean).",
  "BIMI record + VMC certificate for the GearUpToFit logo to render in Gmail/Apple Mail.",
  "Dedicated Brevo IP (or warm shared IP) — warm-up schedule: 50 → 500 → 2k → 10k over 14 days.",
  "List-Unsubscribe + List-Unsubscribe-Post headers (RFC 8058 one-click) — Brevo enables by default; verify in raw source.",
  "Google Postmaster Tools + Microsoft SNDS connected; alert on spam-rate >0.1% or domain reputation drop to 'Medium'.",
  "Plain-text alternative auto-generated (Brevo handles, but verify on first send via mail-tester.com — target ≥9.5/10).",
  "Image-to-text ratio < 60% in every email; alt text on every image; no link shorteners (bit.ly etc).",
  "Re-engagement gate: if contact has 0 opens in last 90 days, move to sunset flow (3 'still want this?' emails, then suppress).",
];

const gdprChecklist = [
  "Double opt-in on the WatchMatch result form (Brevo confirmation email step) — required for EU contacts.",
  "Granular consent: separate checkbox for 'WatchMatch result emails' vs 'GearUpToFit weekly newsletter'. No pre-ticked boxes.",
  "Consent log: store IP, timestamp, form version, and consent text in Brevo contact attributes (CONSENT_TS, CONSENT_IP, CONSENT_VERSION).",
  "One-click unsubscribe in every email (List-Unsubscribe header + visible footer link). Honor within 10 business days max — Brevo is instant.",
  "Right-to-erasure workflow: Brevo Contact API DELETE endpoint wired to a /privacy/erasure form on gearuptofit.com.",
  "Data Processing Addendum (DPA) signed with Brevo (auto-available in account settings) — required for EU operations.",
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
      [...emails, ...lifecycleEmails]
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
            12 human-written emails across a 12-month lifecycle — pre-purchase
            nurture (8 emails / 21 days) plus post-purchase activation, accessory,
            UGC and annual upgrade flows. Built for the official Brevo WordPress
            plugin with full segmentation matrix, KPI benchmarks, A/B test plan,
            deliverability and GDPR controls.
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
