import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { CheckCircle, ClipboardCopy, Mail, MousePointerClick, Route as RouteIcon, Tags, Timer, Workflow } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/brevo-running-shoe-sequence")({
  head: () => ({
    meta: [
      { title: "GearUpToFit Brevo Running Shoe Email Sequence" },
      {
        name: "description",
        content:
          "A premium WordPress-to-Brevo email automation sequence for GearUpToFit, focused on running shoes while supporting the wider fitness site.",
      },
      { property: "og:title", content: "GearUpToFit Brevo Running Shoe Email Sequence" },
      {
        property: "og:description",
        content:
          "Human-written running shoe nurture emails, WordPress/Brevo trigger plan, segmentation, and site-wide content strategy.",
      },
    ],
    links: [{ rel: "canonical", href: "https://gearuptofit.com/brevo-running-shoe-sequence/" }],
  }),
  component: BrevoRunningShoeSequence,
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

const guideLinks = [
  ["Running shoe master guide", "https://gearuptofit.com/running/how-to-choose-the-right-running-shoes/"],
  ["Best running shoes", "https://gearuptofit.com/review/best-running-shoes/"],
  ["Beginner running shoes", "https://gearuptofit.com/review/best-running-shoes-for-beginners/"],
  ["Overpronation shoes", "https://gearuptofit.com/review/best-running-shoes-for-overpronation/"],
  ["Plantar fasciitis shoes", "https://gearuptofit.com/review/best-running-shoes-for-plantar-fasciitis/"],
  ["Daily trainers", "https://gearuptofit.com/review/best-daily-running-shoes/"],
  ["Running shoe fit", "https://gearuptofit.com/running/how-running-shoes-should-fit"],
  ["Zone 2 running calculator", "https://gearuptofit.com/running/zone-2-running-calculator/"],
  ["Running recovery", "https://gearuptofit.com/the-role-of-rest-and-recovery-in-maximizing-your-running-performance/"],
] as const;

const emailSequence: EmailStep[] = [
  {
    day: "Immediately",
    subject: "Your running shoe shortlist — and the mistake I want you to avoid",
    preheader: "Start here before you buy another pair that feels good in the store and wrong after mile three.",
    goal: "Deliver value fast, build trust, and send readers back to the GearUpToFit running shoe hub.",
    body: `Hi {{ contact.FIRSTNAME | default: "there" }},

If you are looking for new running shoes, here is the honest starting point: the “best” shoe is not the one with the loudest launch campaign. It is the shoe that matches your foot, your pace, your weekly mileage, your surface, and the reason you are running in the first place.

Most runners get this backwards. They choose cushioning first. Or color. Or whatever shoe a faster runner wears. Then two weeks later the shoe is either too narrow, too soft, too unstable, too aggressive, or simply not built for the kind of miles they actually run.

So before you buy anything, use this simple filter:

1. If you are new or rebuilding consistency, choose comfort, forgiveness, and a stable landing over speed.
2. If your easy runs make up most of your week, buy a daily trainer before a race shoe.
3. If your arches collapse inward or your ankles feel tired, do not ignore stability.
4. If your heel or plantar fascia gets angry, prioritize rocker geometry, support, and a secure heel hold.
5. If you run trails, choose grip and protection before stack height.

I built the GearUpToFit running shoe guides to make that decision calmer, more practical, and more honest. Start with the full guide, then use the next emails to narrow your match.

No hype. No “one shoe for everyone.” Just better decisions for better miles.

— Alexios
GearUpToFit`,
    cta: "Read the running shoe guide",
    url: "https://gearuptofit.com/running/how-to-choose-the-right-running-shoes/",
    brevoRule: "Trigger when a WordPress form is submitted on /watch-match/, running-shoe quiz pages, or any running-shoe buyer guide. Add tags: source_wordpress, interest_running_shoes, lifecycle_new_subscriber.",
  },
  {
    day: "Day 1",
    subject: "The 5-question shoe test I use before recommending any pair",
    preheader: "A practical fit framework you can use before opening Amazon, a brand site, or a store wall.",
    goal: "Teach a reusable buying framework and reduce random product hopping.",
    body: `Hi {{ contact.FIRSTNAME | default: "there" }},

Before I recommend a running shoe, I want five answers.

Not your favorite brand. Not your dream race. Not the shoe that looks fastest.

These five:

1. What hurts after running — if anything?
2. Where do you run most: road, treadmill, trail, track, mixed?
3. What is your normal run: 20 easy minutes, 5K training, long runs, marathon work, walking plus jogging?
4. Do your shoes wear more on the inside edge, outside edge, or evenly?
5. Do you want the shoe to feel soft, stable, light, bouncy, protective, or invisible?

Those answers tell you far more than marketing words like “energy return” or “premium foam.”

For most runners, the safest first move is a reliable daily trainer: comfortable enough for easy miles, stable enough when form gets tired, durable enough to survive real training, and versatile enough that you do not need a full shoe rotation on day one.

If you are comparing shoes now, read the main GearUpToFit comparison and do not just look at the winner. Look at the “best for” reason. That is where the real match happens.

Tomorrow I will show you how to avoid the most expensive mistake in running shoes: buying speed before consistency.

— Alexios`,
    cta: "Compare the best running shoes",
    url: "https://gearuptofit.com/review/best-running-shoes/",
    brevoRule: "Send 1 day after signup unless contact clicked a race-day carbon shoe link; if they did, keep the email but add tag intent_race_day.",
  },
  {
    day: "Day 3",
    subject: "Do not buy a race shoe if this is what you actually need",
    preheader: "Fast shoes are exciting. Daily trainers are what make most runners better.",
    goal: "Shift users toward practical daily trainers before premium race purchases.",
    body: `Hi {{ contact.FIRSTNAME | default: "there" }},

Race shoes are fun to read about. Carbon plates, super foams, aggressive rockers — they feel like performance in a box.

But here is the part most shoe roundups do not say loudly enough: if your weekly running is mostly easy mileage, a race shoe is not your foundation. It is a tool for specific workouts and race days.

Your daily trainer is the shoe that actually changes your month.

It is the shoe you reach for when you are a little tired, when the schedule says “easy 40,” when you are building from two runs a week to four, when you need comfort more than drama.

A good daily trainer should give you:

• enough cushioning to keep legs fresh
• enough stability to stay controlled late in the run
• enough durability that you are not replacing it immediately
• enough comfort that you stop thinking about your feet

That last point matters most. The best shoe often disappears under you.

If you only buy one pair this season, make it the pair you can use consistently. Speed comes later. Consistency comes first.

— Alexios`,
    cta: "Find a daily trainer",
    url: "https://gearuptofit.com/review/best-daily-running-shoes/",
    brevoRule: "Send to all running_shoes contacts. If tag beginner_runner exists, use the beginner guide CTA variant instead.",
  },
  {
    day: "Day 5",
    subject: "If you are new to running, ignore 80% of shoe advice",
    preheader: "Beginners do not need the most aggressive shoe. They need the shoe that helps them come back tomorrow.",
    goal: "Serve beginner runners with empathy and reduce intimidation.",
    body: `Hi {{ contact.FIRSTNAME | default: "there" }},

Beginner runners are often given advice meant for people who already run five days a week.

That is backwards.

If you are starting, restarting, losing weight, coming back from pain, or trying to build the habit, your shoe has one job: make running feel repeatable.

Not heroic. Not maximal. Repeatable.

Look for a shoe that feels comfortable from the first minute, gives your foot enough room when it swells, keeps the heel secure, and does not push you into a stride you have not earned yet.

You do not need a carbon plate. You do not need an unstable super foam. You do not need to copy an elite athlete. You need a shoe that makes the next run feel possible.

Here is a simple beginner rule: if a shoe feels amazing standing still but strange while jogging, trust the jog. Running shoes are not furniture. They have to work in motion.

The beginner guide below is built around comfort, confidence, and consistency — exactly where new runners should begin.

— Alexios`,
    cta: "See beginner-friendly picks",
    url: "https://gearuptofit.com/review/best-running-shoes-for-beginners/",
    brevoRule: "Send when tag beginner_runner exists, or use as a conditional branch if WordPress form field RUNNING_LEVEL equals beginner/restarting.",
  },
  {
    day: "Day 7",
    subject: "A quick check for overpronation, heel pain, and shoes that fight your body",
    preheader: "Pain is not always a shoe problem, but the wrong shoe can absolutely keep the problem alive.",
    goal: "Segment pain/support needs and route users to high-intent GearUpToFit articles.",
    body: `Hi {{ contact.FIRSTNAME | default: "there" }},

Let me be careful here: shoes do not magically fix every running pain.

Training load, strength, sleep, recovery, mobility, and your own injury history all matter.

But the wrong shoe can keep poking the same problem.

If your foot collapses inward and your knees or shins feel beaten up, you may need a more stable platform. If your heel is sharp in the morning or the first steps of the day feel rough, plantar fascia irritation may be part of the story. If your toes go numb, your shoe may be too narrow or too short once your foot expands during a run.

This is where “softest shoe possible” is not always the answer. Sometimes too much softness without guidance makes your foot work harder. Sometimes the best shoe is the one that feels supportive, boring, and predictable.

Use the guides below as a decision aid, not a diagnosis. If pain is persistent, get a qualified professional involved. But if you suspect your current shoe is working against you, this is the place to start.

— Alexios`,
    cta: "Check support-focused shoe guides",
    url: "https://gearuptofit.com/review/best-running-shoes-for-overpronation/",
    brevoRule: "If WordPress field PAIN_POINT contains plantar_fasciitis, swap CTA URL to /review/best-running-shoes-for-plantar-fasciitis/ and add tag pain_plantar_fasciitis.",
  },
  {
    day: "Day 10",
    subject: "The fit mistake that ruins otherwise great running shoes",
    preheader: "Most shoe regrets start with size, width, heel lockdown, or toe room — not the foam.",
    goal: "Help readers buy confidently and reduce returns/regret.",
    body: `Hi {{ contact.FIRSTNAME | default: "there" }},

One reason running shoe advice gets messy is that a great shoe in the wrong size becomes a bad shoe.

The fit checklist is simple:

• Leave thumb-width room in front of your longest toe.
• Check width while standing, not sitting.
• Make sure your heel feels secure without crushing the top of your foot.
• Try the shoe with the socks you actually run in.
• If you run longer than 45 minutes, remember your feet can swell.

Do not confuse tight with performance. A shoe can feel “locked in” and still be too narrow. A shoe can feel roomy and still hold the midfoot properly.

Here is the test I like: jog for a few minutes and notice what your brain keeps returning to. If you keep noticing pressure on the arch, rubbing on the heel, squeezed toes, or instability through corners, the shoe is telling you something.

The best fit is not the one you can tolerate. It is the one you can forget.

— Alexios`,
    cta: "Read the running shoe fit guide",
    url: "https://gearuptofit.com/running/how-running-shoes-should-fit",
    brevoRule: "Send to everyone who has not clicked an Amazon outbound link yet; this educates before purchase and improves trust.",
  },
  {
    day: "Day 14",
    subject: "Your shoes matter — but your easy pace matters too",
    preheader: "A better shoe helps. A better weekly rhythm changes everything.",
    goal: "Expand from running shoes into GearUpToFit training content without losing relevance.",
    body: `Hi {{ contact.FIRSTNAME | default: "there" }},

Once your shoes are no longer fighting you, the next upgrade is not another product. It is your pacing.

Many runners accidentally run their easy days too hard. Then every run feels like a test, recovery never catches up, and shoes get blamed for fatigue that is really a training rhythm problem.

Zone 2 work is not glamorous, but it is powerful: conversational running, lower stress, better aerobic development, and more total volume without breaking yourself down.

This is also where watches and heart-rate tools can help — not because the device is magic, but because it gives you feedback before ego takes over.

If you want running to feel sustainable, pair the right shoes with easier easy runs. That combination beats hype.

Use the calculator below to turn “easy” into a number you can actually use.

— Alexios`,
    cta: "Calculate your Zone 2 range",
    url: "https://gearuptofit.com/running/zone-2-running-calculator/",
    brevoRule: "Bridge to wider GearUpToFit running/training content. Add tag interest_training if clicked.",
  },
  {
    day: "Day 18",
    subject: "How to know when it is time to replace your running shoes",
    preheader: "Mileage matters, but your body and outsole usually tell the real story first.",
    goal: "Create a natural future purchase moment without aggressive selling.",
    body: `Hi {{ contact.FIRSTNAME | default: "there" }},

Running shoes rarely fail all at once. They fade.

The foam feels a little flatter. The outsole gets smoother. Your calves feel a little more beaten up after normal runs. The shoe still looks fine by the door, but it no longer protects you the same way.

General mileage ranges help, but they are not perfect. A lighter runner on clean roads may get more life from a shoe than a heavier runner doing daily pavement miles. Trail surfaces, heat, gait, and foam type all change the timeline.

Watch for these signs:

• your usual easy run feels harsher than it should
• one side of the outsole is heavily worn
• the midsole has deep creasing and no rebound
• new aches appear without a training change
• the upper no longer holds your foot securely

If you loved the shoe, replacing it with the newer version can work — but do not assume every update feels the same. Check what changed: stack height, width, foam, weight, heel counter, and rocker.

That is exactly why GearUpToFit reviews focus on use-case, not just specs.

— Alexios`,
    cta: "Review current top picks",
    url: "https://gearuptofit.com/review/best-running-shoes/",
    brevoRule: "Send after education emails; if contact clicked daily trainer content twice, send the daily-trainer URL instead.",
  },
  {
    day: "Day 24",
    subject: "Recovery is the hidden feature your shoes cannot replace",
    preheader: "The right gear supports training. Recovery is what lets the training work.",
    goal: "Broaden trust into recovery/nutrition while keeping running-shoe context.",
    body: `Hi {{ contact.FIRSTNAME | default: "there" }},

The right running shoe can make training more comfortable. It can reduce friction, improve stability, protect your legs, and make consistency easier.

But no shoe replaces recovery.

If your legs are always heavy, your sleep is poor, your easy days are too hard, or your long runs jump too quickly, even the best shoe starts to feel wrong.

A smarter setup looks like this:

• shoes matched to your actual mileage and surface
• easy runs that are truly easy
• gradual increases instead of heroic jumps
• protein and carbohydrates that support the work
• sleep and rest days treated as training tools

That is the bigger GearUpToFit philosophy: gear matters, but it works best inside a plan.

If you want better runs, do not just ask, “What should I buy?” Ask, “What system helps me come back stronger?”

— Alexios`,
    cta: "Improve your running recovery",
    url: "https://gearuptofit.com/the-role-of-rest-and-recovery-in-maximizing-your-running-performance/",
    brevoRule: "Move engaged readers into broader running/performance segment. Add tag interest_recovery on click.",
  },
  {
    day: "Day 30",
    subject: "Keep this simple: your next best running shoe decision",
    preheader: "A calm final checklist before choosing your next pair.",
    goal: "Summarize the journey and invite a decisive buying-guide click.",
    body: `Hi {{ contact.FIRSTNAME | default: "there" }},

If you have read this far, you do not need more hype. You need a clean decision.

Here is the final checklist:

If you want one shoe for most runs, choose a daily trainer.
If you are new, choose comfort and forgiveness.
If you need support, do not pretend neutral shoes are automatically better.
If you have heel or fascia irritation, prioritize fit, support, and smooth transitions.
If you run trails, buy grip and protection before looks.
If you are racing, earn the race shoe with consistent training first.

And if you are still unsure, choose the shoe that makes running feel less complicated.

That is the whole point. The right gear should remove friction from the habit you are trying to build.

Whenever you are ready, the GearUpToFit running shoe hub is there to help you compare the current best options without the noise.

See you on the next run,
Alexios`,
    cta: "Choose your next running shoe",
    url: "https://gearuptofit.com/review/best-running-shoes/",
    brevoRule: "Final nurture email. If no clicks across the sequence, move to low-frequency newsletter segment instead of continuing purchase CTAs.",
  },
];

const wordpressSteps = [
  "Use a WordPress form on GearUpToFit pages, not a separate app backend: Brevo official plugin, WPForms/Fluent Forms Brevo integration, or a small custom WordPress plugin using Brevo's API server-side.",
  "Send every subscriber into one Brevo list: GearUpToFit — Running Shoe Welcome. Add consent text below the form and store the signup page as SOURCE_URL.",
  "Pass WordPress fields to Brevo contact attributes: FIRSTNAME, RUNNING_LEVEL, PAIN_POINT, SURFACE, SHOE_GOAL, QUIZ_RESULT, SOURCE_URL, LAST_GUIDE_VIEWED.",
  "Apply tags from WordPress at signup: source_wordpress, interest_running_shoes, plus contextual tags like beginner_runner, stability_needed, plantar_fasciitis, trail_running, daily_trainer, race_day.",
  "Build the automation inside Brevo: entry trigger is contact added to the Running Shoe Welcome list; delays and if/else branches use tags and link-click behavior.",
  "Use Brevo transactional/API sending only from WordPress server-side. Never expose the Brevo API key in browser JavaScript or the embedded quiz markup.",
];

function BrevoRunningShoeSequence() {
  const [copied, setCopied] = useState(false);
  const exportText = useMemo(() => buildExportText(), []);

  const copySequence = async () => {
    await navigator.clipboard.writeText(exportText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="min-h-screen bg-gradient-dark text-foreground">
      <main className="mx-auto max-w-6xl px-4 py-10 md:py-16">
        <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <Badge className="mb-4 border-primary/30 bg-primary/15 text-primary">WordPress → Brevo automation</Badge>
          <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <div>
              <h1 className="max-w-4xl text-4xl font-bold uppercase leading-none tracking-normal md:text-6xl">
                GearUpToFit Running Shoe Email Sequence
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
                A human, helpful, WordPress-native Brevo nurture sequence for the whole GearUpToFit brand — led by running shoes, then expanded into training, recovery, nutrition, and smart fitness gear.
              </p>
            </div>
            <div className="glass rounded-2xl p-5">
              <div className="mb-4 flex items-center gap-3">
                <Workflow className="h-5 w-5 text-primary" />
                <p className="text-sm font-semibold uppercase tracking-wider">Automation blueprint</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <Metric label="Emails" value="9" />
                <Metric label="Days" value="30" />
                <Metric label="Platform" value="WP" />
              </div>
              <Button onClick={copySequence} className="mt-5 w-full rounded-xl bg-gradient-primary font-bold uppercase tracking-wider text-primary-foreground">
                {copied ? <CheckCircle className="mr-2 h-4 w-4" /> : <ClipboardCopy className="mr-2 h-4 w-4" />}
                {copied ? "Copied" : "Copy Full Sequence"}
              </Button>
            </div>
          </div>
        </motion.section>

        <section className="mb-8 grid gap-4 md:grid-cols-3">
          <StrategyCard icon={<RouteIcon className="h-5 w-5" />} title="Primary angle" text="Help readers choose shoes that fit their body, training, pain points, and mileage — not just the newest launch." />
          <StrategyCard icon={<Tags className="h-5 w-5" />} title="Segmentation" text="Branch by beginner, stability, plantar fasciitis, daily trainer, trail, race-day, and training interest." />
          <StrategyCard icon={<MousePointerClick className="h-5 w-5" />} title="Conversion" text="Each email earns trust first, then sends readers to a precise GearUpToFit guide or calculator." />
        </section>

        <section className="glass mb-8 rounded-2xl p-5 md:p-8">
          <div className="mb-5 flex items-center gap-3">
            <Timer className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold uppercase tracking-normal">Exact WordPress + Brevo Setup</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {wordpressSteps.map((step, index) => (
              <div key={step} className="rounded-xl border border-border/50 bg-card/35 p-4">
                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">Step {index + 1}</div>
                <p className="text-sm leading-relaxed text-foreground/85">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {guideLinks.map(([label, url]) => (
            <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-border/50 bg-card/30 p-4 text-sm font-semibold transition-all hover:border-primary/50 hover:bg-card/50">
              <span className="text-primary">→</span> {label}
            </a>
          ))}
        </section>

        <section className="space-y-5">
          {emailSequence.map((email, index) => (
            <motion.article key={email.subject} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} className="glass rounded-2xl p-5 md:p-7">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge className="border-primary/25 bg-primary/10 text-primary">Email {index + 1}</Badge>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{email.day}</span>
                  </div>
                  <h2 className="text-2xl font-bold leading-tight tracking-normal md:text-3xl">{email.subject}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{email.preheader}</p>
                </div>
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div className="grid gap-5 lg:grid-cols-[1fr_0.42fr]">
                <div className="whitespace-pre-line rounded-xl border border-border/40 bg-background/35 p-4 text-sm leading-relaxed text-foreground/90 md:text-base">
                  {email.body}
                </div>
                <aside className="space-y-3">
                  <InfoBlock label="Goal" text={email.goal} />
                  <InfoBlock label="CTA" text={email.cta} />
                  <a href={email.url} target="_blank" rel="noopener noreferrer" className="block break-words rounded-xl border border-primary/30 bg-primary/10 p-3 text-xs font-semibold text-primary hover:bg-primary/15">
                    {email.url}
                  </a>
                  <InfoBlock label="Brevo rule" text={email.brevoRule} />
                </aside>
              </div>
            </motion.article>
          ))}
        </section>
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/40 bg-card/40 p-3">
      <div className="text-2xl font-bold text-gradient">{value}</div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function StrategyCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">{icon}</div>
      <h2 className="mb-2 text-lg font-bold uppercase tracking-normal">{title}</h2>
      <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}

function InfoBlock({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-xl border border-border/40 bg-card/35 p-3">
      <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-primary">{label}</div>
      <p className="text-sm leading-relaxed text-foreground/85">{text}</p>
    </div>
  );
}

function buildExportText() {
  const setup = wordpressSteps.map((step, index) => `${index + 1}. ${step}`).join("\n");
  const emails = emailSequence
    .map(
      (email, index) =>
        `EMAIL ${index + 1} — ${email.day}\nSubject: ${email.subject}\nPreheader: ${email.preheader}\nGoal: ${email.goal}\n\n${email.body}\n\nCTA: ${email.cta}\nURL: ${email.url}\nBrevo rule: ${email.brevoRule}`,
    )
    .join("\n\n---\n\n");

  return `GEARUPTOFIT WORDPRESS → BREVO RUNNING SHOE EMAIL SEQUENCE\n\nSETUP\n${setup}\n\n---\n\n${emails}`;
}