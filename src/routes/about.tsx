import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Award, Compass, Heart, Mail, ShieldCheck, Watch } from "lucide-react";
import AffiliateDisclosure from "@/components/AffiliateDisclosure";

const SITE_URL = "https://wrist-wonderland-hub.lovable.app";
const PARENT_URL = "https://gearuptofit.com";
const LOGO_URL = `${PARENT_URL}/wp-content/uploads/2023/01/gearuptofit-logo.png`;

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "GearUpToFit",
  alternateName: "WatchMatch AI",
  url: PARENT_URL,
  logo: LOGO_URL,
  description:
    "Independent endurance-sports gear publication. Hand-tested running, cycling and wearable reviews with a transparent, commission-blind editorial process.",
  sameAs: [
    "https://www.youtube.com/@gearuptofit",
    "https://www.instagram.com/gearuptofit",
  ],
  foundingDate: "2022",
  knowsAbout: [
    "Smartwatches",
    "GPS sportwatches",
    "Fitness trackers",
    "Running gear",
    "Heart-rate monitoring",
  ],
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "GearUpToFit Editorial Team",
  url: `${SITE_URL}/about`,
  jobTitle: "Editor & Reviewer",
  worksFor: { "@type": "Organization", name: "GearUpToFit", url: PARENT_URL },
  knowsAbout: [
    "Wearable technology",
    "GPS accuracy testing",
    "Endurance training",
    "Running biomechanics",
  ],
  description:
    "A small team of long-distance runners, cyclists and gadget engineers who hand-test every wearable before it enters the WatchMatch database.",
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "WatchMatch AI",
  url: SITE_URL,
  publisher: { "@type": "Organization", name: "GearUpToFit", url: PARENT_URL },
  inLanguage: "en",
};

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About WatchMatch AI — Independent smartwatch picks by GearUpToFit" },
      {
        name: "description",
        content:
          "Who builds WatchMatch AI, how we test wearables, and why our rankings stay commission-blind. Real people, real wrists, real training data.",
      },
      { property: "og:title", content: "About WatchMatch AI" },
      {
        property: "og:description",
        content:
          "Independent endurance-tech editors. Hand-tested wearables. Transparent, commission-blind rankings.",
      },
      { rel: "canonical", href: `${SITE_URL}/about` },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(organizationJsonLd),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(personJsonLd),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(websiteJsonLd),
      },
    ],
  }),
  component: AboutPage,
});

const pillars = [
  {
    icon: Watch,
    title: "Wrists, not press releases",
    body:
      "Every watch in the database is worn, charged, drained and re-charged by a member of the team. We log GPS drift on real routes, not on a spec sheet.",
  },
  {
    icon: Compass,
    title: "Match-first, sell-second",
    body:
      "The quiz exists to match you with the right watch — not to push the highest-commission product. The ranking engine literally does not know what we earn.",
  },
  {
    icon: ShieldCheck,
    title: "Commission-blind ranking",
    body:
      "Affiliate links are added after the score is computed. If the #1 match earns us $0 and the #4 match earns us $30, the #1 match still wins.",
  },
  {
    icon: Award,
    title: "Editor-reviewed picks",
    body:
      "A human editor signs off on every watch before it enters the database — and re-reviews it when firmware or pricing materially changes.",
  },
];

function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
            <Heart className="h-3 w-3" /> About WatchMatch AI
          </div>
          <h1 className="text-balance text-4xl font-bold uppercase tracking-tight md:text-5xl">
            We're runners and cyclists who got tired of bad watch advice.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">
            WatchMatch AI is the matchmaking tool built by{" "}
            <a
              href={PARENT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-4 hover:underline"
            >
              GearUpToFit
            </a>
            , an independent endurance-sports gear publication. We test wearables on long runs,
            cold rides, sweaty intervals and the school run — then turn what we learn into a
            scoring engine that picks the right watch for <em>your</em> wrist, phone and training.
          </p>
        </motion.div>

        <section className="mb-12 grid gap-4 md:grid-cols-2">
          {pillars.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="glass rounded-2xl border border-border/60 p-5"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <p.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-1 text-sm font-bold uppercase tracking-wide">{p.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{p.body}</p>
            </motion.div>
          ))}
        </section>

        <section className="mb-12 rounded-2xl border border-border/60 bg-card/40 p-6 md:p-8">
          <h2 className="mb-3 text-xl font-bold uppercase tracking-tight md:text-2xl">
            How we make money (and why it doesn't bend the rankings)
          </h2>
          <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
            When you buy a watch through one of our links, the retailer pays us a small
            commission. It costs you nothing extra. That commission keeps the lights on, pays the
            testers, and funds the next round of devices.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            The scoring engine is intentionally blind to commission rates. Full details live on
            our{" "}
            <Link to="/methodology" className="text-primary underline-offset-4 hover:underline">
              methodology page
            </Link>{" "}
            and our{" "}
            <Link
              to="/affiliate-disclosure"
              className="text-primary underline-offset-4 hover:underline"
            >
              affiliate disclosure
            </Link>
            .
          </p>
        </section>

        <section className="mb-12 rounded-2xl border border-border/60 bg-card/40 p-6 md:p-8">
          <h2 className="mb-3 text-xl font-bold uppercase tracking-tight md:text-2xl">
            Talk to a human
          </h2>
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            Found a spec we got wrong? Disagree with a pick? Want us to test a watch we don't have
            yet? We read every email.
          </p>
          <a
            href="mailto:hello@gearuptofit.com"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-primary-foreground glow-primary transition hover:opacity-90"
          >
            <Mail className="h-4 w-4" /> hello@gearuptofit.com
          </a>
        </section>

        <AffiliateDisclosure variant="footer" />

        <div className="mt-10 text-center">
          <Link
            to="/"
            className="text-sm font-semibold uppercase tracking-[0.18em] text-primary underline-offset-4 hover:underline"
          >
            ← Take the quiz
          </Link>
        </div>
      </div>
    </main>
  );
}