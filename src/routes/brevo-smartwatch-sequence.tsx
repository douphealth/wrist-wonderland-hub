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
    subject: "{{ contact.FIRSTNAME | default: \"Hi\" }}, your WatchMatch report is ready",
    preheader: "Your top match, the three checks I would make before buying, and the report link.",
    goal: "Deliver the promised report immediately, explain the recommendation like a trusted expert, and route the reader to a public result URL.",
    body: `Hi {{ contact.FIRSTNAME | default: "there" }},

I finished your WatchMatch report.

Your top match is the {{ contact.TOP_MATCH_BRAND }} {{ contact.TOP_MATCH_MODEL }} — chosen around your phone, wrist, sport profile, battery preference, and the kind of watch you said you actually want to wear.

Before you buy anything, I would check three things in this order:

1. **Case fit.** Specs do not matter if the case overhangs your wrist or catches on sleeves. If your wrist is under 160 mm, read the case-size note carefully.
2. **GPS mode.** If you run, hike, cycle, or train around tall buildings, multi-band/all-systems GPS matters more than most health widgets.
3. **Real battery.** Always-on display, SpO2, music, and GPS can cut the advertised number dramatically. Judge battery by your routine, not the box.

Your full report is here:

{{ contact.WATCHMATCH_URL }}

If you are torn between your match and another model, reply with both names. I will tell you which one I would buy and why.

Alex
GearUpToFit

P.S. Do not rush the purchase because one retailer says "deal". Smartwatch prices move constantly. Fit and ecosystem are harder to fix than price.`,
    cta: "Open my WatchMatch report",
    url: "{{ contact.WATCHMATCH_URL }}",
    brevoRule:
      "Trigger immediately after WatchMatch opt-in. Store WATCHMATCH_URL as the public lovable.app or gearuptofit.com URL only — never a preview/editor URL.",
  },
  {
    day: "Day 2",
    subject: "The phone compatibility mistake that creates expensive returns",
    preheader: "A beautiful watch is useless if your phone cannot unlock its best features.",
    goal: "Help the reader avoid platform lock-in and make the recommendation feel personalized, not generic.",
    body: `Quick but important.

A lot of smartwatch regret starts with phone compatibility, not hardware.

Here is the simple version:

- **Apple Watch** is for iPhone. If you may switch to Android soon, do not buy one unless you are comfortable replacing the watch too.
- **Galaxy Watch / Wear OS** is best on Android. Some features are reduced or unavailable outside the intended ecosystem.
- **Garmin, Coros, Polar, Suunto, Fitbit, Amazfit** are more platform-flexible. They are usually the safer choice if you care more about training data than phone-style features.

My rule: if your watch is mostly for calls, texts, payments, and apps, choose the watch built for your phone. If it is mostly for training, sleep, hiking, or battery life, start with the sport-first brands.

Helpful comparisons:
- Apple Watch vs Garmin: ${G("review/apple-watch-vs-garmin")}
- Best smartwatches for Android: ${G("review/best-smartwatches-for-android")}
- Best smartwatches for iPhone: ${G("review/best-smartwatches-for-iphone")}

If your WatchMatch result looks wrong for your phone, reply and I will sanity-check it.

Alex`,
    cta: "Check platform-specific picks",
    url: G("review/apple-watch-vs-garmin"),
    brevoRule:
      "Branch by PHONE_OS when possible: iPhone contacts see Apple/Garmin context first; Android contacts see Wear OS/Garmin context first.",
  },
  {
    day: "Day 4",
    subject: "Battery claims are not fake — but they are not your battery life",
    preheader: "The honest way to compare 18 hours, 36 hours, 14 days, and 40 days.",
    goal: "Build trust by explaining the battery trade-off with specific, buyer-useful context.",
    body: `Battery numbers are not exactly lies. They are controlled-lab promises.

A brand can advertise "14 days" because the test often assumes GPS off, always-on display off, SpO2 off, music off, low brightness, light notifications, and no long workouts.

Real life is different.

Use this translation when comparing watches:

- **Daily smartwatch battery**: Apple Watch / Pixel Watch territory. Great features, frequent charging.
- **2–5 day battery**: premium AMOLED sport watches with many features switched on.
- **1–3 week battery**: sport-first watches, often Garmin/Coros/Suunto/Amazfit depending on display and GPS settings.
- **Ultra endurance battery**: usually fewer smartwatch luxuries, but far less charging anxiety.

The buying question is not "Which watch lasts longest?" It is: **Will this watch still last long enough with the features I will actually use?**

Read the deeper battery guide here:
${G("review/best-smartwatches-with-long-battery-life")}

Alex

P.S. If you travel often, prioritize charging speed and charger availability too. A proprietary cable you forget at home can ruin a great watch.`,
    cta: "Compare real-world battery",
    url: G("review/best-smartwatches-with-long-battery-life"),
    brevoRule:
      "If BATTERY_PREF_DAYS is high, emphasize sport watches and low-power GPS modes in the email template variant.",
  },
  {
    day: "Day 6",
    subject: "The sensors worth paying for — and the ones I would not chase",
    preheader: "Health features are useful, but not all of them should change your buying decision.",
    goal: "Reduce overwhelm and help health-focused users separate meaningful sensors from marketing noise.",
    body: `Modern watches can look like tiny medical dashboards. That does not mean every sensor deserves your money.

Here is how I would rank them:

1. **Optical heart rate + HRV** — the foundation for training load, recovery, sleep trends, and Zone 2 work. Accuracy varies by fit, skin tone, temperature, and movement.
2. **ECG** — useful if you specifically care about atrial fibrillation screening. It is not a full heart check, but it can be meaningful for the right person.
3. **Multi-band GNSS** — technically a location sensor, but for runners/cyclists/hikers it may matter more than another wellness metric.
4. **SpO2 / skin temp / EDA / body composition** — useful for trends, weaker as absolute measurements. I would not pay a large premium for these alone.

If health is your primary reason for buying, start with reliability and comfort. A slightly less flashy watch you wear every night beats a premium one you charge on the nightstand.

Useful guides:
- ECG watches: ${G("review/best-smartwatches-with-ecg")}
- Watches for seniors: ${G("review/best-smartwatches-for-seniors")}
- Blood pressure watch guide: ${G("review/best-smartwatches-with-blood-pressure-monitor")}

Alex`,
    cta: "See sensor-by-sensor picks",
    url: G("review/best-smartwatches-with-ecg"),
    brevoRule:
      "Tag contacts who click health content as health_focus and prioritize ECG/sleep/recovery recommendations later.",
  },
  {
    day: "Day 9",
    subject: "Smartwatch, sport watch, band, or hybrid? The clean decision tree",
    preheader: "Stop comparing products that were designed for different jobs.",
    goal: "Clarify categories so the reader feels guided instead of pushed toward a single expensive product.",
    body: `If you are still comparing very different devices, use this decision tree.

Choose a **smartwatch** if you want the phone-on-wrist experience: calls, messages, payments, apps, polished screen, and good enough fitness.

Choose a **sport watch** if training matters: better battery, stronger GPS tools, physical buttons, recovery metrics, routes, and durability.

Choose a **fitness band** if you want activity, sleep, heart rate, and habit-building without a big screen or big price.

Choose a **hybrid** if you want an analog-looking watch with discreet tracking and long battery.

The trap is buying the category you admire instead of the category you will wear. A rugged 51 mm sport watch can be amazing and still wrong for someone who wants something slim for work. A beautiful smartwatch can be perfect and still wrong for someone training 10 hours a week.

If your original answers have changed, re-run WatchMatch here:
https://gearuptofit.com/watch-match/

Alex`,
    cta: "Re-run WatchMatch",
    url: "https://gearuptofit.com/watch-match/",
    brevoRule:
      "Use category-specific variants when WATCH_CATEGORY or PRIMARY_USE is available. Avoid pushing a premium sport watch to band-intent users.",
  },
  {
    day: "Day 12",
    subject: "{{ contact.FIRSTNAME | default: \"Quick check\" }} — what is holding you back?",
    preheader: "If price, size, looks, or uncertainty is the blocker, reply and I will help.",
    goal: "Invite a real reply and turn hesitation into a useful, human buying consultation.",
    body: `Just checking in.

If you already bought the {{ contact.TOP_MATCH_MODEL | default: "watch" }}, I hope it feels like the right call. If you have not, the blocker is usually one of these:

1. **Price** — there is often a near-equivalent model that gives up one luxury feature and saves real money.
2. **Size** — case diameter, thickness, and strap shape matter more than people expect.
3. **Looks** — the best training watch is still a bad buy if you hate wearing it outside workouts.
4. **Fear of choosing wrong** — normal. Specs are noisy, and every brand has trade-offs.

Reply with the blocker and the two models you are considering. I will give you a straight answer.

No script. No pressure. Just a practical second opinion.

Alex`,
    cta: "Reply for a second opinion",
    url: "mailto:hello@gearuptofit.com?subject=WatchMatch%20second%20opinion",
    brevoRule:
      "Set Reply-To to a monitored inbox. Treat replies as high-intent support, not a sales automation.",
  },
  {
    day: "Day 16",
    subject: "Should you wait for the next model? My honest framework",
    preheader: "Sometimes waiting is smart. Most of the time, it is just decision paralysis.",
    goal: "Defuse the upgrade-cycle objection honestly without manufacturing urgency.",
    body: `The hardest smartwatch question is not always "which one?" Sometimes it is "should I wait?"

Here is the framework I use.

Wait if:
- your current watch is only 1–2 years old and still works well;
- the rumored next model fixes a specific problem you care about;
- you are not training for anything and do not need the upgrade now.

Buy now if:
- your current watch is unreliable, inaccurate, or dead by dinner;
- you are missing a feature that changes daily use: better GPS, safer health alerts, longer battery, brighter display, or better phone integration;
- the current model is discounted and already solves your problem.

Most yearly updates are incremental. The meaningful jumps usually come every 2–4 years, depending on the brand.

Current flagship guide:
${G("review/best-smartwatches-of-the-year")}

Alex

P.S. The best time to buy is when the watch solves a real problem you have now — not when a keynote tells you to care.`,
    cta: "See current flagships",
    url: G("review/best-smartwatches-of-the-year"),
    brevoRule:
      "Do not use false urgency. If the contact has not clicked any link, reduce frequency after this email rather than escalating pressure.",
  },
  {
    day: "Day 21",
    subject: "Last WatchMatch note — keep the weekly guide only if you want it",
    preheader: "This sequence ends here unless you choose to keep hearing from GearUpToFit.",
    goal: "End respectfully, protect deliverability, and ask permission before moving into broader ongoing emails.",
    body: `This is the last note in your WatchMatch series.

I hope it helped you make a calmer decision — whether that meant buying your match, choosing an alternate, waiting, or realizing you do not need a new watch right now.

If you want one useful GearUpToFit email a week — watches, training gear, recovery tools, and buying advice — you can opt in here:

https://gearuptofit.com/newsletter/?confirm=1

If not, no problem. I will stop the WatchMatch sequence here.

Thanks for letting me help with the decision.

Alex
GearUpToFit`,
    cta: "Keep getting the weekly guide",
    url: "https://gearuptofit.com/newsletter/?confirm=1",
    brevoRule:
      "Final pre-purchase note. Only move contacts to weekly emails after an explicit click/confirmation; otherwise end the sequence.",
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
              Pre-purchase sequence (8 emails · 21 days)
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

        {/* Lifecycle / post-purchase */}
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Layers className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold uppercase tracking-tight">
              Post-purchase lifecycle (4 emails · 12 months)
            </h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Triggered when the Brevo goal <code className="text-primary">amazon_click</code> fires
            (or contact self-reports a purchase via reply to email 6). Drives activation,
            accessory revenue, UGC, and the natural 12-month re-engagement window.
          </p>
          <div className="space-y-4">
            {lifecycleEmails.map((e, i) => (
              <motion.article
                key={`lc-${i}`}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="glass rounded-2xl p-5 md:p-6 space-y-3"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <Badge className="border-primary/25 bg-primary/10 text-primary uppercase tracking-widest text-[10px]">
                    Lifecycle {i + 1}
                  </Badge>
                  <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                    <Timer className="w-3.5 h-3.5" />
                    {e.day}
                  </span>
                </div>
                <h3 className="text-lg md:text-xl font-bold leading-snug">{e.subject}</h3>
                <p className="text-xs text-muted-foreground italic">Preheader: {e.preheader}</p>
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

        {/* Segmentation matrix */}
        <section className="glass rounded-2xl p-5 md:p-8 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <GitBranch className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold uppercase tracking-tight">
              Segmentation matrix
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Brevo dynamic content blocks branch on <code className="text-primary">PHONE_OS</code>,{" "}
            <code className="text-primary">PRIMARY_USE</code> and{" "}
            <code className="text-primary">BUDGET_BAND</code>. Each segment swaps the hero recommendation
            and the email-2 platform reframe.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm border-collapse">
              <thead>
                <tr className="text-left text-primary/80 uppercase tracking-wider text-[10px]">
                  <th className="border-b border-border/40 py-2 pr-3">Segment</th>
                  <th className="border-b border-border/40 py-2 pr-3">Hero pick</th>
                  <th className="border-b border-border/40 py-2 pr-3">Swap-ins</th>
                  <th className="border-b border-border/40 py-2">Cadence override</th>
                </tr>
              </thead>
              <tbody>
                {segmentationMatrix.map((s, i) => (
                  <tr key={i} className="align-top">
                    <td className="border-b border-border/20 py-2 pr-3 font-medium">{s.segment}</td>
                    <td className="border-b border-border/20 py-2 pr-3 text-primary">{s.primary}</td>
                    <td className="border-b border-border/20 py-2 pr-3 text-muted-foreground">{s.swap.join(" · ")}</td>
                    <td className="border-b border-border/20 py-2 text-muted-foreground">{s.cadence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* KPI benchmarks */}
        <section className="glass rounded-2xl p-5 md:p-8 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold uppercase tracking-tight">
              KPI targets &amp; alert floors
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm border-collapse">
              <thead>
                <tr className="text-left text-primary/80 uppercase tracking-wider text-[10px]">
                  <th className="border-b border-border/40 py-2 pr-3">Metric</th>
                  <th className="border-b border-border/40 py-2 pr-3">Target</th>
                  <th className="border-b border-border/40 py-2 pr-3">Alert floor</th>
                  <th className="border-b border-border/40 py-2">Note</th>
                </tr>
              </thead>
              <tbody>
                {kpiBenchmarks.map((k, i) => (
                  <tr key={i} className="align-top">
                    <td className="border-b border-border/20 py-2 pr-3 font-medium">{k.metric}</td>
                    <td className="border-b border-border/20 py-2 pr-3 text-primary">{k.target}</td>
                    <td className="border-b border-border/20 py-2 pr-3 text-destructive/90">{k.floor}</td>
                    <td className="border-b border-border/20 py-2 text-muted-foreground">{k.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* A/B tests */}
        <section className="glass rounded-2xl p-5 md:p-8 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Beaker className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold uppercase tracking-tight">
              A/B test backlog (run sequentially)
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {abTests.map((t) => (
              <div key={t.id} className="rounded-xl border border-border/40 bg-card/40 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary/15 text-primary border-primary/25 text-[10px] uppercase tracking-widest">
                    {t.id}
                  </Badge>
                  <span className="text-sm font-bold">{t.element}</span>
                </div>
                <div className="text-xs text-muted-foreground leading-relaxed">
                  <div><strong className="text-primary/80">A:</strong> {t.a}</div>
                  <div><strong className="text-primary/80">B:</strong> {t.b}</div>
                </div>
                <div className="text-[11px] text-muted-foreground border-t border-border/30 pt-2">
                  <Target className="inline w-3 h-3 mr-1 text-primary" />
                  {t.winnerMetric} · {t.traffic}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Deliverability + GDPR */}
        <section className="grid md:grid-cols-2 gap-5">
          <div className="glass rounded-2xl p-5 md:p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg md:text-xl font-bold uppercase tracking-tight">
                Deliverability checklist
              </h2>
            </div>
            <ul className="space-y-2.5">
              {deliverabilityChecklist.map((d, i) => (
                <li key={i} className="flex gap-2 text-xs md:text-sm text-muted-foreground leading-relaxed">
                  <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="glass rounded-2xl p-5 md:p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg md:text-xl font-bold uppercase tracking-tight">
                GDPR &amp; consent
              </h2>
            </div>
            <ul className="space-y-2.5">
              {gdprChecklist.map((d, i) => (
                <li key={i} className="flex gap-2 text-xs md:text-sm text-muted-foreground leading-relaxed">
                  <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
