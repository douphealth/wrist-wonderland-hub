import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Brain, Database, Scale, ShieldCheck, Sparkles, Zap } from "lucide-react";
import AffiliateDisclosure from "@/components/AffiliateDisclosure";

export const Route = createFileRoute("/methodology")({
  head: () => ({
    meta: [
      { title: "How WatchMatch AI works — Our scoring methodology" },
      {
        name: "description",
        content:
          "Inside the deterministic scoring engine that powers WatchMatch AI: data sources, weighting, tie-breakers, editorial review and how affiliate links are kept out of the ranking.",
      },
      { rel: "canonical", href: "https://wrist-wonderland-hub.lovable.app/methodology" },
      { property: "og:title", content: "WatchMatch AI methodology" },
      {
        property: "og:description",
        content:
          "Deterministic scoring, transparent weights, editorially reviewed picks. Here is exactly how we match you with a watch.",
      },
    ],
  }),
  component: MethodologyPage,
});

const pillars = [
  {
    icon: Database,
    title: "Real, sourced specs",
    body:
      "Every watch in the database is hand-entered from the manufacturer's own published spec sheet — case size in mm, weight in grams, GPS chipset, battery profile, water rating, and OS compatibility. Marketing copy never enters the dataset.",
  },
  {
    icon: Scale,
    title: "Deterministic scoring",
    body:
      "Your quiz answers feed a transparent, weighted scoring engine. Given the same answers, you will always get the same ranking — no random shuffling, no A/B nudging toward higher-commission products.",
  },
  {
    icon: Brain,
    title: "Editorial review",
    body:
      "The flagship list is reviewed quarterly by GearUpToFit editors who actually run, swim, climb and sleep in these watches. Models with known firmware regressions or supply issues are flagged or removed.",
  },
  {
    icon: ShieldCheck,
    title: "Commission-blind ranking",
    body:
      "Affiliate links are appended after the ranking is computed, never before. A watch we do not have an affiliate program for can still rank #1.",
  },
  {
    icon: Zap,
    title: "Live price + availability",
    body:
      "When possible we fetch live Amazon price, image, and availability at render time. The price you see is the price Amazon is showing right now, not a stale MSRP.",
  },
  {
    icon: Sparkles,
    title: "Built to be wrong, gracefully",
    body:
      "We always surface a runner-up and a budget alternative. If the top match is wrong for your wrist size, lifestyle, or OS, the alternative is one click away.",
  },
];

function MethodologyPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-12 md:py-20">
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="text-xs uppercase tracking-[0.22em] text-primary hover:underline">
          ← Back to WatchMatch
        </Link>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-3xl md:text-5xl font-bold tracking-tight"
        >
          How WatchMatch AI actually works
        </motion.h1>
        <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed">
          We built WatchMatch to be the smartwatch recommendation we wished
          existed when we were buying our own: transparent, repeatable, and
          honest about its limits. Here is exactly what runs under the hood.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {pillars.map((p) => (
            <div key={p.title} className="glass rounded-2xl p-5 border border-primary/15">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 mb-3">
                <p.icon className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-lg font-bold mb-1">{p.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>

        <section className="mt-12 space-y-4 text-sm md:text-base text-muted-foreground leading-relaxed">
          <h2 className="text-2xl font-bold text-foreground">The scoring formula, plainly</h2>
          <p>
            Each watch starts at 0. We add weighted points across five axes
            derived from your answers: <strong>category fit</strong> (does it
            actually do the sport you picked), <strong>OS compatibility</strong>{" "}
            (a hard gate — incompatible watches are filtered out, not
            penalized), <strong>battery profile</strong>, <strong>budget
            band</strong>, and <strong>feature overlap</strong> with your
            must-haves. Ties are broken by editorial confidence score, then by
            recency of release.
          </p>
          <p>
            The full engine lives in our open source-style{" "}
            <code className="rounded bg-secondary/60 px-1.5 py-0.5 text-xs">scoring-engine.ts</code>{" "}
            module. There is no hidden ML model and no per-user variance.
          </p>
        </section>

        <section className="mt-12 space-y-4 text-sm md:text-base text-muted-foreground leading-relaxed">
          <h2 className="text-2xl font-bold text-foreground">What we are not</h2>
          <p>
            We are not a paid review site, a sponsored ranking, or a
            comparison-shopping engine. We do not accept payment to include or
            promote a watch. We do not have a relationship with any watch
            manufacturer.
          </p>
        </section>

        <div className="mt-12">
          <AffiliateDisclosure variant="banner" />
        </div>

        <div className="mt-10 flex flex-wrap gap-3 text-xs">
          <Link to="/affiliate-disclosure" className="underline text-muted-foreground hover:text-primary">
            Affiliate disclosure
          </Link>
          <span className="text-muted-foreground/40">·</span>
          <a
            href="https://gearuptofit.com/privacy-policy/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-muted-foreground hover:text-primary"
          >
            Privacy policy
          </a>
        </div>
      </div>
    </div>
  );
}