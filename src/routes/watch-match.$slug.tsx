import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { amazonURL, categoryImage, gutfURL } from "@/lib/amazon";
import { getAmazonProducts, type AmazonProduct } from "@/lib/amazon-product.functions";
import catSmartwatch from "@/assets/cat-smartwatch.jpg";
import catSportwatch from "@/assets/cat-sportwatch.jpg";
import catBand from "@/assets/cat-band.jpg";
import catHybrid from "@/assets/cat-hybrid.jpg";
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
  Download,
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
  ShieldCheck,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import EmailGate, { hasSubscribed } from "@/components/EmailGate";

const searchSchema = z.object({
  d: z.string().optional(),
});

/**
 * Absolute origin used for og:image / twitter:image. Social crawlers require
 * fully-qualified URLs — relative asset paths are silently ignored.
 */
const OG_ORIGIN = "https://wrist-wonderland-hub.lovable.app";

function ogImageForSlug(slug: string): string {
  // Slug shape: `${primaryUse}-${phone}-${form}-${style}` (see generateSlug).
  const form = (slug.split("-")[2] || "smartwatch").toLowerCase();
  const map: Record<string, string> = {
    smartwatch: catSmartwatch,
    sportwatch: catSportwatch,
    band: catBand,
    hybrid: catHybrid,
  };
  const asset = map[form] ?? catSmartwatch;
  return asset.startsWith("http") ? asset : `${OG_ORIGIN}${asset}`;
}

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
      { property: "og:type", content: "article" },
      { property: "og:image", content: ogImageForSlug(params.slug) },
      { property: "og:image:width", content: "896" },
      { property: "og:image:height", content: "896" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: ogImageForSlug(params.slug) },
      {
        name: "twitter:title",
        content: `${slugTitle(params.slug)} — Your Perfect Smartwatch Match`,
      },
      {
        name: "twitter:description",
        content:
          "9-question WatchMatch AI quiz on GearUpToFit — find the smartwatch that fits your wrist, sport and life.",
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
  const [gateOpen, setGateOpen] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const autoOpenedRef = useRef(false);

  // Hydrate subscribed flag and auto-open the EmailGate after a soft dwell
  // (10s) on first visit. We never re-open for users who've already opted in
  // or dismissed the modal in this session.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (hasSubscribed()) {
      setSubscribed(true);
      return;
    }
    const dismissed = sessionStorage.getItem("wm_gate_dismissed_v1");
    if (dismissed) return;
    const t = window.setTimeout(() => {
      if (autoOpenedRef.current) return;
      autoOpenedRef.current = true;
      setGateOpen(true);
    }, 10000);
    return () => window.clearTimeout(t);
  }, []);

  // Exit-intent: pointer leaving the top of the viewport (desktop only).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (subscribed) return;
    if (sessionStorage.getItem("wm_gate_dismissed_v1")) return;
    const onLeave = (e: MouseEvent) => {
      if (e.clientY > 0) return;
      if (autoOpenedRef.current) return;
      autoOpenedRef.current = true;
      setGateOpen(true);
    };
    document.addEventListener("mouseout", onLeave);
    return () => document.removeEventListener("mouseout", onLeave);
  }, [subscribed]);

  const closeGate = useCallback(() => {
    setGateOpen(false);
    try {
      sessionStorage.setItem("wm_gate_dismissed_v1", "1");
    } catch {
      /* ignore */
    }
  }, []);

  const onUnlock = useCallback(() => {
    setSubscribed(true);
    setGateOpen(false);
  }, []);

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

  // Build live keyword set from the user's answers + top match — used to pull
  // the most relevant published guides from gearuptofit.com via the WP REST API.
  const liveKeywords = useMemo(() => {
    const kws = new Set<string>();
    kws.add(primary.watch.brand.toLowerCase());
    kws.add(answers.primaryUse);
    if (answers.form === "band") kws.add("fitness tracker");
    if (answers.form === "sportwatch") kws.add("sports watch");
    if (answers.form === "smartwatch") kws.add("smartwatch");
    if (answers.features.includes("ecg")) kws.add("ECG");
    if (answers.features.includes("swim")) kws.add("swimming");
    return Array.from(kws).slice(0, 5);
  }, [answers, primary]);

  const fetchLivePosts = useServerFn(getRelevantGutfPosts);
  const livePostsQuery = useQuery({
    queryKey: ["gutf-posts", liveKeywords.join("|")],
    queryFn: () => fetchLivePosts({ data: { keywords: liveKeywords, limit: 6 } }),
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Resolve real Amazon product URLs + images via SerpApi for the recommended
  // watches. Falls back to category images + tagged search URLs when SerpApi
  // is unavailable, so the UI never renders a broken link or empty image.
  const productLookupWatches = useMemo(() => {
    const list = [primary.watch];
    if (setup.alt) list.push(setup.alt.watch);
    if (setup.budget) list.push(setup.budget.watch);
    for (const t of top) if (!list.find((w) => w.id === t.watch.id)) list.push(t.watch);
    return list.slice(0, 8).map((w) => ({
      brand: w.brand,
      model: w.model,
      asin: w.asin,
      imageURL: w.imageURL,
    }));
  }, [primary, setup, top]);

  const fetchAmazon = useServerFn(getAmazonProducts);
  const amazonQuery = useQuery({
    queryKey: ["amazon", productLookupWatches.map((w) => `${w.brand}-${w.model}`).join("|")],
    queryFn: () => fetchAmazon({ data: { watches: productLookupWatches } }),
    staleTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const productMap = useMemo(() => {
    const m = new Map<string, AmazonProduct>();
    for (const entry of amazonQuery.data?.products ?? []) m.set(entry.key, entry.product);
    return m;
  }, [amazonQuery.data]);

  const productFor = (w: { brand: string; model: string }): AmazonProduct | undefined =>
    productMap.get(`${w.brand}::${w.model}`.toLowerCase());

  const resolvedImage = (w: Parameters<typeof categoryImage>[0] & { brand: string; model: string }) =>
    productFor(w)?.image || categoryImage(w);
  const resolvedUrl = (w: Parameters<typeof amazonURL>[0]) =>
    productFor(w)?.url || amazonURL(w);

  const amazonLoading = amazonQuery.isLoading;

  const handleDownloadPDF = useCallback(async () => {
    if (!answers || !rec || !setup) return;
    toast.info("Generating your WatchMatch report…");
    const { generateWatchReportPDF } = await import("@/lib/watch-report-pdf");
    const pMap = new Map<string, { url: string; image: string | null }>();
    for (const entry of amazonQuery.data?.products ?? []) {
      pMap.set(entry.key, { url: entry.product.url, image: entry.product.image });
    }
    await generateWatchReportPDF({
      answers,
      recommendation: rec,
      setup,
      top,
      radarData,
      products: pMap,
    });
    toast.success("Your WatchMatch PDF report has been downloaded.");
  }, [answers, rec, setup, top, radarData, amazonQuery.data]);
  // Silent error handler — swap broken thumbnails for the category image once,
  // then detach the handler so we never enter an error loop or log to console.
  const handleImgError = (
    e: React.SyntheticEvent<HTMLImageElement>,
    w: Parameters<typeof categoryImage>[0],
  ) => {
    const img = e.currentTarget;
    img.onerror = null;
    const fallback = categoryImage(w);
    if (img.src !== fallback) img.src = fallback;
  };

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
            <div className="mt-6 flex flex-col items-center gap-3">
              <Button
                onClick={handleDownloadPDF}
                size="lg"
                className="bg-gradient-primary glow-primary font-bold uppercase tracking-wider px-6 md:px-8 h-12 rounded-xl text-sm group"
              >
                <Download className="w-4 h-4 mr-2 group-hover:animate-bounce" />
                Download PDF Report
              </Button>
              <p className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-widest">
                <ShieldCheck className="w-3 h-3 text-primary" />
                Database verified · {WATCH_DB_LAST_UPDATED}
              </p>
            </div>
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
                <div className="aspect-square rounded-2xl bg-gradient-to-br from-card-elevated to-background flex items-center justify-center border border-border/40 overflow-hidden relative">
                  <img
                    src={resolvedImage(primary.watch)}
                    alt={`${primary.watch.brand} ${primary.watch.model} — ${primary.watch.category}`}
                    loading="lazy"
                    width={896}
                    height={896}
                    className="absolute inset-0 w-full h-full object-contain bg-card-elevated p-4"
                    onError={(e) => handleImgError(e, primary.watch)}
                  />
                  {amazonLoading && (
                    <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
                  <span className="absolute bottom-3 left-3 text-[10px] uppercase tracking-widest text-white/80 bg-black/40 backdrop-blur px-2 py-1 rounded-full">
                    {primary.watch.brand}
                  </span>
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
                    href={resolvedUrl(primary.watch)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-busy={amazonLoading}
                    className={`inline-flex items-center gap-2 bg-gradient-primary glow-primary-sm hover:opacity-90 px-5 h-11 rounded-xl font-bold uppercase tracking-wider text-xs text-primary-foreground transition-all ${amazonLoading ? "animate-pulse" : ""}`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {amazonLoading ? "Verifying live price…" : "Check Price on Amazon"}
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
          {setup.alt && (
            <RotationCard
              title="Alternate Pick"
              subtitle="Different brand, similar match"
              item={setup.alt}
              icon="🎯"
              imageUrl={resolvedImage(setup.alt.watch)}
              buyUrl={resolvedUrl(setup.alt.watch)}
              loading={amazonLoading}
            />
          )}
          {setup.budget && (
            <RotationCard
              title="Budget Pick"
              subtitle="Best value option"
              item={setup.budget}
              icon="💸"
              imageUrl={resolvedImage(setup.budget.watch)}
              buyUrl={resolvedUrl(setup.budget.watch)}
              loading={amazonLoading}
            />
          )}
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
                <div className="hidden sm:block w-14 h-14 rounded-lg border border-border/40 flex-shrink-0 overflow-hidden">
                  {amazonLoading ? (
                    <div className="w-full h-full animate-pulse bg-card-elevated" />
                  ) : (
                  <img
                    src={resolvedImage(s.watch)}
                    alt={`${s.watch.brand} ${s.watch.model}`}
                    loading="lazy"
                    width={160}
                    height={160}
                    className="w-full h-full object-contain bg-card-elevated p-1"
                    onError={(e) => handleImgError(e, s.watch)}
                  />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm md:text-base truncate">
                    {s.watch.brand} {s.watch.model}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ${s.watch.priceUSD} · {s.watch.batteryDays}d battery · {s.watch.display}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-bold text-gradient tabular-nums">{s.matchPercent}%</div>
                  <a
                    href={resolvedUrl(s.watch)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] uppercase tracking-widest text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Buy <ExternalLink className="w-2.5 h-2.5" />
                  </a>
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

        {/* Live posts pulled from gearuptofit.com WP REST API */}
        <motion.div {...fadeUp} className="glass rounded-2xl p-5 md:p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl md:text-2xl font-bold uppercase tracking-tight">
                Latest From GearUpToFit
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Live feed — fresh reviews and guides matched to your answers.
              </p>
            </div>
          </div>
          {livePostsQuery.isLoading && (
            <div className="grid sm:grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 rounded-xl border border-border/40 bg-card/20 animate-pulse" />
              ))}
            </div>
          )}
          {livePostsQuery.data?.error && (
            <p className="text-sm text-muted-foreground">{livePostsQuery.data.error}</p>
          )}
          {livePostsQuery.data?.posts && livePostsQuery.data.posts.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-3">
              {livePostsQuery.data.posts.map((p) => (
                <a
                  key={p.id}
                  href={p.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex gap-3 p-3 rounded-xl border border-border/40 bg-card/30 hover:border-primary/40 hover:bg-card/50 transition-all"
                >
                  {p.image && (
                    <img
                      src={p.image}
                      alt=""
                      loading="lazy"
                      className="w-20 h-20 rounded-lg object-cover flex-shrink-0 border border-border/30"
                      onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm leading-snug mb-1 group-hover:text-primary transition-colors line-clamp-2">
                      {p.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {p.excerpt}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          )}
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
  imageUrl,
  buyUrl,
  loading,
}: {
  title: string;
  subtitle: string;
  item: ReturnType<typeof scoreWatches>[number];
  icon: string;
  imageUrl?: string;
  buyUrl?: string;
  loading?: boolean;
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
      <div className="aspect-[16/9] rounded-xl border border-border/40 overflow-hidden mb-3 relative">
        {loading && (
          <div className="absolute inset-0 z-10 animate-pulse bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        )}
        <img
          src={imageUrl || categoryImage(item.watch)}
          alt={`${item.watch.brand} ${item.watch.model}`}
          loading="lazy"
          width={896}
          height={896}
          className="absolute inset-0 w-full h-full object-contain bg-card-elevated p-3"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).onerror = null;
            (e.currentTarget as HTMLImageElement).src = categoryImage(item.watch);
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
        <span className="absolute bottom-2 left-2 text-[10px] uppercase tracking-widest text-white/80 bg-black/40 backdrop-blur px-2 py-1 rounded-full">
          {item.watch.brand}
        </span>
      </div>
      <div className="font-bold text-base md:text-lg mb-1">
        {item.watch.brand} {item.watch.model}
      </div>
      <div className="text-xs text-muted-foreground mb-3">
        ${item.watch.priceUSD} · {item.watch.batteryDays}d battery · {item.watch.display}
      </div>
      <p className="text-sm text-foreground/80 mb-4 leading-relaxed line-clamp-3">{item.watch.highlight}</p>
      <a
        href={buyUrl || amazonURL(item.watch)}
        target="_blank"
        rel="noopener noreferrer"
        aria-busy={loading}
        className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary hover:underline ${loading ? "opacity-70" : ""}`}
      >
        {loading ? "Verifying…" : "Check on Amazon"} <ExternalLink className="w-3 h-3" />
      </a>
    </motion.div>
  );
}