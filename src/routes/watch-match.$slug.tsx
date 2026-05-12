import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { z } from "zod";
import {
  decodeAnswers,
  answersFromSlug,
  QuizAnswers,
} from "@/lib/quiz-data";
import { generateRecommendation } from "@/lib/recommendation-engine";
import { scoreWatches, buildSetup } from "@/lib/scoring-engine";
import { WATCH_DB_LAST_UPDATED } from "@/lib/watch-database";
import { amazonURL, amazonImage, gutfURL } from "@/lib/amazon";
import { pickGuides } from "@/lib/featured-guides";
import { getRelevantGutfPosts } from "@/lib/gearuptofit-posts.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowLeft,
  Award,
  Battery,
  CheckCircle,
  Copy,
  ExternalLink,
  Heart,
  Share2,
  ShoppingCart,
  Sparkles,
  Star,
  Target,
  Watch as WatchIcon,
  Zap,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";

const searchSchema = z.object({
  d: z.string().optional(),
});

export const Route = createFileRoute("/watch-match/$slug")({
  validateSearch: searchSchema,
  head: ({ params }) => ({
    meta: [
      {
        title: `${slugTitle(params.slug)} — Your Perfect Smartwatch Match`,
      },
      {
        name: "description",
        content:
          "Personalized smartwatch recommendation from GearUpToFit — rotation pick, battery plan, full spec breakdown and verified Amazon links.",
      },
      {
        property: "og:title",
        content: `${slugTitle(params.slug)} — Your Perfect Smartwatch Match`,
      },
      {
        property: "og:description",
        content:
          "Take the 9-question WatchMatch AI quiz on GearUpToFit and find the smartwatch that actually fits your wrist, sport and life.",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: `https://gearuptofit.com/watch-match/${params.slug}`,
      },
    ],
  }),
  component: WatchMatchResult,
});

function slugTitle(slug: string) {
  return slug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
};

function WatchMatchResult() {
  const { slug } = Route.useParams();
  const { d } = Route.useSearch();
  const [copied, setCopied] = useState(false);

  const answers: QuizAnswers | null = useMemo(() => {
    if (d) {
      const decoded = decodeAnswers(d);
      if (decoded) return decoded;
    }
    return answersFromSlug(slug);
  }, [d, slug]);

  const rec = useMemo(() => (answers ? generateRecommendation(answers) : null), [answers]);
  const setup = useMemo(() => (answers ? buildSetup(answers) : null), [answers]);
  const top = useMemo(() => (answers ? scoreWatches(answers).slice(0, 5) : []), [answers]);

  const radarData = useMemo(() => {
    if (!answers) return [];
    return [
      {
        axis: "Battery",
        value: Math.min(10, Math.round((answers.battery / 30) * 10)),
      },
      {
        axis: "Sensors",
        value: Math.min(10, answers.features.length + 2),
      },
      {
        axis: "Sport",
        value:
          answers.primaryUse === "multisport" || answers.primaryUse === "running"
            ? 9
            : answers.primaryUse === "outdoor"
              ? 8
              : 5,
      },
      {
        axis: "Smart",
        value: answers.form === "smartwatch" ? 9 : answers.form === "hybrid" ? 5 : 6,
      },
      {
        axis: "Style",
        value: answers.style === "luxury" ? 9 : answers.style === "minimal" ? 7 : 6,
      },
      {
        axis: "Health",
        value: answers.features.includes("ecg") || answers.features.includes("spo2") ? 9 : 5,
      },
    ];
  }, [answers]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  if (!answers || !rec || !setup) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-dark">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <Zap className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold uppercase">No Results Found</h1>
          <p className="text-muted-foreground">Take the quiz to get your personalized watch match.</p>
          <Link to="/">
            <Button className="bg-gradient-primary glow-primary font-bold uppercase tracking-wider px-8 h-12">
              Take the Quiz
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const primary = setup.primary;

  return (
    <div className="min-h-screen pb-16 bg-gradient-dark">
      <header className="sticky top-0 z-20 glass-strong px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">New Match</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-primary flex items-center justify-center">
              <WatchIcon className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              WatchMatch AI
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              title="Copy link"
              className="hover:bg-primary/10"
            >
              {copied ? (
                <CheckCircle className="w-4 h-4 text-primary" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative pt-8 md:pt-16 pb-8 px-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[200px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[150px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-5xl mx-auto relative z-10"
        >
          <div className="text-center mb-8">
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30 text-xs uppercase tracking-[0.15em] px-4 py-1.5">
              AI-Powered Analysis Complete
            </Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold uppercase tracking-tight mb-4 leading-[0.9]">
              {rec.profile.category}
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {rec.profile.summary}
            </p>
            <p className="mt-4 text-[10px] text-muted-foreground uppercase tracking-widest">
              Database verified · {WATCH_DB_LAST_UPDATED}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            <motion.div {...fadeUp} className="glass rounded-2xl p-5 md:p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Your Watch Profile
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke="oklch(0.32 0.02 260)" />
                  <PolarAngleAxis
                    dataKey="axis"
                    tick={{ fill: "oklch(0.65 0.02 260)", fontSize: 11 }}
                  />
                  <Radar
                    name="Profile"
                    dataKey="value"
                    stroke="oklch(0.62 0.22 25)"
                    fill="oklch(0.62 0.22 25)"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div {...fadeUp} className="grid grid-cols-2 gap-3">
              {[
                { label: "Form", value: rec.profile.formFactor, icon: "⌚" },
                { label: "Battery Target", value: rec.profile.batteryTarget, icon: "🔋" },
                { label: "Phone", value: answers.phone === "iphone" ? "iPhone" : answers.phone === "android" ? "Android" : "Either", icon: "📱" },
                { label: "Wrist", value: `${answers.wristSize} mm`, icon: "📏" },
                { label: "Style", value: answers.style.charAt(0).toUpperCase() + answers.style.slice(1), icon: "🎨" },
                { label: "Use", value: answers.primaryUse.charAt(0).toUpperCase() + answers.primaryUse.slice(1), icon: "🎯" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="glass rounded-2xl p-4 text-center hover:border-primary/30 transition-all"
                >
                  <span className="text-xl mb-1.5 block">{item.icon}</span>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">
                    {item.label}
                  </div>
                  <div className="font-bold text-xs md:text-sm">{item.value}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6 md:space-y-8">
        {/* #1 Recommendation */}
        <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
          <div className="glass rounded-2xl p-5 md:p-8 border-primary/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[60px]" />
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-xl bg-gradient-primary glow-primary-sm flex items-center justify-center">
                <Award className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl md:text-2xl font-bold uppercase tracking-tight">#1 Match</h2>
                <p className="text-xs text-muted-foreground">
                  Best of {top.length > 0 ? "25+" : 0} watches analyzed
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl md:text-4xl font-bold text-gradient tabular-nums leading-none">
                  {primary.matchPercent}%
                </div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Match
                </div>
              </div>
            </div>

            <div className="md:flex md:gap-6 md:items-start">
              <div className="md:w-2/5 mb-5 md:mb-0">
                <div className="aspect-square rounded-2xl bg-gradient-to-br from-card-elevated to-background flex items-center justify-center border border-border/40 overflow-hidden">
                  <WatchIcon className="w-32 h-32 text-primary/40" strokeWidth={1} />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl md:text-4xl font-bold mb-1">
                  {primary.watch.brand} {primary.watch.model}
                </h3>
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold">
                    ${primary.watch.priceUSD}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{primary.watch.year} · {primary.watch.display}</span>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <Spec icon="🔋" value={`${primary.watch.batteryDays}d`} />
                  <Spec icon="📐" value={`${primary.watch.caseSizeMM}mm`} />
                  <Spec icon="⚖️" value={`${primary.watch.weightGrams}g`} />
                  <Spec icon="💧" value={primary.watch.waterRating} />
                </div>

                <p className="text-sm md:text-base mb-4 leading-relaxed">{primary.watch.highlight}</p>

                {primary.reasons.length > 0 && (
                  <div className="mb-5 space-y-2">
                    {primary.reasons.slice(0, 4).map((r) => (
                      <div key={r} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <a
                    href={amazonURL(primary.watch)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-gradient-primary glow-primary-sm hover:opacity-90 px-5 h-11 rounded-xl font-bold uppercase tracking-wider text-xs text-primary-foreground transition-all"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Check Price on Amazon
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  {primary.watch.reviewPath && (
                    <a
                      href={gutfURL(primary.watch.reviewPath)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 border border-primary/30 hover:bg-primary/10 px-5 h-11 rounded-xl font-bold uppercase tracking-wider text-xs text-primary transition-all"
                    >
                      <BookOpen className="w-4 h-4" />
                      Read Full Review
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Alt + Budget */}
        <div className="grid md:grid-cols-2 gap-4">
          {setup.alt && <RotationCard title="Alternate Pick" subtitle="Different brand, similar match" item={setup.alt} icon="🎯" />}
          {setup.budget && <RotationCard title="Budget Pick" subtitle="Best value option" item={setup.budget} icon="💸" />}
        </div>

        {/* Why */}
        <motion.div {...fadeUp} className="glass rounded-2xl p-5 md:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold uppercase tracking-tight">Why It Works</h2>
          </div>
          <p className="text-sm md:text-base text-foreground/90 leading-relaxed">{rec.why}</p>
        </motion.div>

        {/* Training emphasis */}
        {rec.emphasis.length > 0 && (
          <motion.div {...fadeUp} className="glass rounded-2xl p-5 md:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold uppercase tracking-tight">
                How to Get the Most From It
              </h2>
            </div>
            <ul className="space-y-3">
              {rec.emphasis.map((e) => (
                <li key={e} className="flex items-start gap-3 text-sm md:text-base">
                  <span className="w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                    ✓
                  </span>
                  <span className="text-foreground/90 leading-relaxed">{e}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Top 5 list */}
        <motion.div {...fadeUp} className="glass rounded-2xl p-5 md:p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Star className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold uppercase tracking-tight">
              Your Top 5 Watches
            </h2>
          </div>
          <div className="space-y-3">
            {top.map((s, idx) => (
              <div
                key={s.watch.id}
                className="flex items-center gap-4 p-3 md:p-4 rounded-xl border border-border/40 bg-card/30 hover:border-primary/30 transition-all"
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    idx === 0
                      ? "bg-gradient-primary text-primary-foreground"
                      : "bg-secondary text-foreground"
                  }`}
                >
                  #{idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm md:text-base truncate">
                    {s.watch.brand} {s.watch.model}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ${s.watch.priceUSD} · {s.watch.batteryDays}d battery · {s.watch.display}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gradient tabular-nums">{s.matchPercent}%</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Match
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Featured Guides from gearuptofit.com */}
        <motion.div {...fadeUp} className="glass rounded-2xl p-5 md:p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl md:text-2xl font-bold uppercase tracking-tight">
                Hand-Picked Guides For You
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Deep-dive reviews and buyer's guides from <span className="text-primary font-semibold">GearUpToFit.com</span>
              </p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {pickGuides(answers, 4).map((g) => (
              <a
                key={g.path}
                href={gutfURL(g.path)}
                target="_blank"
                rel="noopener noreferrer"
                className="group block p-4 rounded-xl border border-border/40 bg-card/30 hover:border-primary/40 hover:bg-card/50 transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <h3 className="font-bold text-sm md:text-base leading-snug group-hover:text-primary transition-colors">
                    {g.title}
                  </h3>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary flex-shrink-0 mt-1" />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{g.blurb}</p>
              </a>
            ))}
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div {...fadeUp} className="glass rounded-2xl p-5 md:p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold uppercase tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {[
              {
                q: "How does WatchMatch AI choose a watch?",
                a: "A deterministic scoring engine compares your answers against verified specs (battery, GPS, sensors, water rating, weight, OS pairing, price) for 25+ flagships. Same answers always produce the same recommendation.",
              },
              {
                q: "Is WatchMatch AI free?",
                a: "Yes — no signup, no email required, no paywall. Product links are Amazon affiliate links (tag: papalex-20) — GearUpToFit may earn a small commission at no extra cost to you. That's what keeps the quiz, the database and the reviews free.",
              },
              {
                q: "Can I use any smartwatch with my iPhone or Android?",
                a: "No. Apple Watch is iPhone-only. Galaxy Watch (Wear OS) requires Android for full features. Garmin, Coros, Suunto, Polar, Fitbit and Amazfit work with both, with minor feature differences.",
              },
              {
                q: "How important is battery life?",
                a: "It depends on use. Daily smartwatch users live with 1–2 day battery. Multi-day adventures or simple wellness tracking benefit hugely from 14-day+ watches like Garmin Instinct or Coros Vertix.",
              },
              {
                q: "AMOLED vs MIP display — which is better?",
                a: "AMOLED is brighter and richer, ideal for everyday use. MIP (transflective) is dimmer indoors but always-on outdoors and sips power — preferred for ultra-long battery sport watches.",
              },
            ].map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-border/40">
                <AccordionTrigger className="text-left text-sm md:text-base font-semibold hover:text-primary">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        {/* Restart CTA */}
        <div className="text-center pt-4">
          <Link to="/">
            <Button
              variant="outline"
              className="rounded-xl font-bold uppercase tracking-wider border-primary/30 hover:bg-primary/10"
            >
              <Copy className="w-4 h-4 mr-2" />
              Take the Quiz Again
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}

function Spec({ icon, value }: { icon: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary/60 border border-border/40 text-xs font-semibold">
      <span>{icon}</span>
      {value}
    </span>
  );
}

function RotationCard({
  title,
  subtitle,
  item,
  icon,
}: {
  title: string;
  subtitle: string;
  item: ReturnType<typeof scoreWatches>[number];
  icon: string;
}) {
  return (
    <motion.div {...fadeUp} className="glass rounded-2xl p-5 md:p-6 hover:border-primary/30 transition-all">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1">
          <h3 className="text-sm font-bold uppercase tracking-wider">{title}</h3>
          <p className="text-[11px] text-muted-foreground">{subtitle}</p>
        </div>
        <div className="text-lg font-bold text-gradient tabular-nums">{item.matchPercent}%</div>
      </div>
      <div className="font-bold text-base md:text-lg mb-1">
        {item.watch.brand} {item.watch.model}
      </div>
      <div className="text-xs text-muted-foreground mb-3">
        ${item.watch.priceUSD} · {item.watch.batteryDays}d battery · {item.watch.display}
      </div>
      <p className="text-sm text-foreground/80 mb-4 leading-relaxed line-clamp-3">{item.watch.highlight}</p>
      <a
        href={amazonURL(item.watch)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary hover:underline"
      >
        Check on Amazon <ExternalLink className="w-3 h-3" />
      </a>
    </motion.div>
  );
}