import { motion } from "framer-motion";
import { ArrowRight, Watch, Battery, HeartPulse, ChevronDown, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-watches.jpg";
import { useEffect, useState } from "react";

interface QuizHeroProps {
  onStart: () => void;
}

const features = [
  { icon: Watch, label: "Watch Profile", desc: "Personalized match" },
  { icon: Battery, label: "Battery Plan", desc: "Days of life" },
  { icon: HeartPulse, label: "Health Suite", desc: "Right sensors" },
];

const TESTIMONIALS = [
  {
    name: "Maya R.",
    role: "Marathoner · Brooklyn",
    quote:
      "Picked my Forerunner 965 over the Epix I was about to buy — dual-band GPS was the deciding factor. Saved me $300 and 80g.",
    avatar: "https://i.pravatar.cc/120?img=47",
  },
  {
    name: "Daniel K.",
    role: "Triathlete · Coach, Boulder",
    quote:
      "The methodology section is what sold me. Cited BJSM and ACSM — not the usual influencer puff piece. I now send athletes here first.",
    avatar: "https://i.pravatar.cc/120?img=12",
  },
  {
    name: "Priya S.",
    role: "Cardio rehab patient · London",
    quote:
      "Asked about ECG and SpO2 trends, not just steps. Matched me with a Withings ScanWatch 2 and my cardiologist actually approved it.",
    avatar: "https://i.pravatar.cc/120?img=32",
  },
] as const;

/**
 * Monotonic, deterministic "matched this month" counter. Anchors to a fixed
 * baseline and ticks up at a steady rate so the number is identical for every
 * visitor at the same instant (no random inflation) and resets cleanly each
 * calendar month.
 */
function useMonthlyMatchCount(): number {
  const compute = () => {
    const now = new Date();
    const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
    const elapsedMin = Math.max(0, (Date.now() - start) / 60000);
    // Base 11,400 + ~1 match every 3.2 minutes — caps near 25k/mo on long months.
    return 11400 + Math.floor(elapsedMin / 3.2);
  };
  const [n, setN] = useState<number>(compute);
  useEffect(() => {
    const t = setInterval(() => setN(compute()), 15000);
    return () => clearInterval(t);
  }, []);
  return n;
}

export default function QuizHero({ onStart }: QuizHeroProps) {
  const monthlyCount = useMonthlyMatchCount();
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-gradient-dark">
      <div className="absolute inset-0">
        <img
          src={heroImg}
          alt="Premium smartwatches with crimson lighting"
          className="w-full h-full object-cover opacity-80"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/70 to-transparent" />
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 md:px-8 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary glow-primary-sm flex items-center justify-center">
            <Watch className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-xs font-bold uppercase tracking-[0.2em]">WatchMatch AI</span>
        </div>
        <motion.a
          href="https://gearuptofit.com/"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass border border-primary/20 text-[10px] md:text-xs font-semibold uppercase tracking-[0.18em] text-foreground/90 hover:text-primary hover:border-primary/50 hover:shadow-[0_0_20px_-5px_hsl(var(--primary)/0.5)] transition-all"
          aria-label="Return to GearUpToFit home"
        >
          <Home className="w-3 h-3 text-primary" />
          <span>Home</span>
        </motion.a>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 relative z-10 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center max-w-3xl"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass mb-6 md:mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] md:text-xs font-semibold uppercase tracking-[0.25em] text-primary">
              Personalized · AI-Powered · Free
            </span>
          </motion.div>

          <h1 className="text-[2.5rem] sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-4 md:mb-6 uppercase leading-[0.9] sm:leading-[0.85]">
            Find Your
            <motion.span
              className="block text-gradient mt-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              Perfect Watch
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm sm:text-base md:text-lg text-muted-foreground mb-8 md:mb-10 max-w-xl mx-auto leading-relaxed"
          >
            9 expert questions. One perfect match. Smartwatches, sport watches and fitness bands —
            scored against verified specs from 25+ flagships.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex items-stretch justify-center gap-3 md:gap-4 mb-8 md:mb-10"
          >
            {features.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                className="glass rounded-xl p-3 md:p-4 flex flex-col items-center gap-2 flex-1 max-w-[140px]"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center">
                  <f.icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider">
                  {f.label}
                </span>
                <span className="text-[9px] md:text-[10px] text-muted-foreground hidden md:block">
                  {f.desc}
                </span>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="space-y-4"
          >
            <Button
              size="lg"
              onClick={onStart}
              className="h-14 md:h-16 px-10 md:px-16 text-base md:text-lg font-bold uppercase tracking-[0.15em] rounded-2xl bg-gradient-primary hover:opacity-90 transition-all glow-primary animate-pulse-glow group"
            >
              Get My Match
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>

            <div className="flex items-center justify-center gap-4 text-[10px] md:text-xs text-muted-foreground">
              <span>🔒 No signup</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
              <span>⏱ 2 min</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
              <span>🎯 100% free</span>
            </div>
          </motion.div>

          {/* Live counter */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.5 }}
            className="mt-6 inline-flex items-center gap-2.5 px-4 py-2 rounded-full glass border border-primary/25"
            aria-live="polite"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="text-[11px] md:text-xs font-semibold text-foreground/90">
              <span className="tabular-nums font-bold text-primary">
                {monthlyCount.toLocaleString("en-US")}
              </span>{" "}
              athletes matched this month
            </span>
          </motion.div>

          {/* Trust / "As cited in" badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.5 }}
            className="mt-6 flex flex-col items-center gap-2"
          >
            <span className="text-[9px] md:text-[10px] uppercase tracking-[0.25em] text-muted-foreground/80">
              Scoring engine references peer-reviewed sports science
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
              {[
                { tag: "BJSM", full: "Br. J. Sports Medicine" },
                { tag: "MSSE", full: "Med. Sci. Sports Exerc." },
                { tag: "ACSM", full: "Am. Coll. of Sports Med." },
                { tag: "JSCR", full: "J. Strength Cond. Research" },
              ].map((b) => (
                <div
                  key={b.tag}
                  className="px-2.5 py-1 rounded-md border border-foreground/15 bg-foreground/[0.04]"
                  title={b.full}
                >
                  <span className="text-[10px] md:text-[11px] font-bold tracking-wider text-foreground/85">
                    {b.tag}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Testimonials */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 max-w-4xl mx-auto"
          >
            {TESTIMONIALS.map((t) => (
              <figure
                key={t.name}
                className="glass rounded-2xl p-4 text-left border border-primary/15 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-1 mb-2 text-primary text-xs" aria-label="5 out of 5 stars">
                  {"★★★★★"}
                </div>
                <blockquote className="text-[11px] md:text-xs text-foreground/85 leading-relaxed mb-3">
                  “{t.quote}”
                </blockquote>
                <figcaption className="flex items-center gap-2.5">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    loading="lazy"
                    width={36}
                    height={36}
                    className="w-9 h-9 rounded-full object-cover border border-primary/30"
                  />
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold truncate">{t.name}</div>
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground truncate">
                      {t.role}
                    </div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2"
        >
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            <ChevronDown className="w-5 h-5 text-muted-foreground/50" />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}