import { QuizAnswers } from "./quiz-data";
import { Watch, watchDatabase } from "./watch-database";

export interface ScoredWatch {
  watch: Watch;
  score: number;
  matchPercent: number;
  reasons: string[];
}

function useMatch(use: string, w: Watch): number {
  if (!use) return 0.7;
  if (w.bestFor.includes(use as any)) return 1;
  // partial credit for adjacent uses
  if (use === "running" && w.bestFor.includes("multisport")) return 0.7;
  if (use === "multisport" && w.bestFor.includes("running")) return 0.7;
  if (use === "everyday" && w.bestFor.includes("health")) return 0.6;
  if (use === "health" && w.bestFor.includes("everyday")) return 0.6;
  return 0.25;
}

function phoneMatch(phone: string, w: Watch): number {
  if (!phone || phone === "both") return w.phones.includes("both") ? 1 : 0.55;
  if (w.phones.includes(phone as any) || w.phones.includes("both")) return 1;
  return 0;
}

function formMatch(form: string, w: Watch): number {
  if (!form) return 0.7;
  if (w.category === form) return 1;
  if (form === "smartwatch" && w.category === "sportwatch") return 0.5;
  if (form === "sportwatch" && w.category === "smartwatch") return 0.5;
  return 0.2;
}

function batteryMatch(target: number, w: Watch): number {
  if (w.batteryDays >= target) return 1;
  // graceful drop-off
  const ratio = w.batteryDays / target;
  if (ratio >= 0.6) return 0.6;
  if (ratio >= 0.35) return 0.3;
  return 0.1;
}

function featuresMatch(want: string[], w: Watch): number {
  if (want.length === 0) return 0.7;
  const have = want.filter((f) => w.features.includes(f)).length;
  return have / want.length;
}

function wristMatch(wristMM: number, w: Watch): number {
  // ideal case-to-wrist ratio: case <= wrist * 0.27
  const ideal = wristMM * 0.27;
  const diff = Math.abs(w.caseSizeMM - ideal);
  if (diff <= 3) return 1;
  if (diff <= 6) return 0.7;
  if (diff <= 10) return 0.4;
  return 0.2;
}

function styleMatch(style: string, w: Watch): number {
  if (!style) return 0.7;
  return w.style.includes(style as any) ? 1 : 0.4;
}

function brandMatch(brands: string[], w: Watch): number {
  if (brands.length === 0) return 0.7;
  return brands.some((b) => b.toLowerCase() === w.brand.toLowerCase()) ? 1 : 0.3;
}

function budgetMatch(budgets: string[], price: number): number {
  if (budgets.length === 0) return 0.6;
  for (const b of budgets) {
    if (b === "under-100" && price < 100) return 1;
    if (b === "100-250" && price >= 100 && price <= 250) return 1;
    if (b === "250-500" && price > 250 && price <= 500) return 1;
    if (b === "500-plus" && price > 500) return 1;
  }
  // partial — adjacent tier
  for (const b of budgets) {
    if (b === "under-100" && price <= 130) return 0.5;
    if (b === "100-250" && price <= 320) return 0.5;
    if (b === "250-500" && price >= 200 && price <= 600) return 0.5;
    if (b === "500-plus" && price >= 400) return 0.5;
  }
  return 0.1;
}

const WEIGHTS = {
  use: 0.18,
  phone: 0.15,
  form: 0.12,
  battery: 0.10,
  features: 0.15,
  wrist: 0.06,
  style: 0.07,
  brand: 0.05,
  budget: 0.12,
};

export function scoreWatches(a: QuizAnswers): ScoredWatch[] {
  return watchDatabase
    .map((w) => {
      const s = {
        use: useMatch(a.primaryUse, w),
        phone: phoneMatch(a.phone, w),
        form: formMatch(a.form, w),
        battery: batteryMatch(a.battery, w),
        features: featuresMatch(a.features, w),
        wrist: wristMatch(a.wristSize, w),
        style: styleMatch(a.style, w),
        brand: brandMatch(a.brand, w),
        budget: budgetMatch(a.budget, w.priceUSD),
      };
      const score = Object.entries(s).reduce(
        (sum, [k, v]) => sum + v * WEIGHTS[k as keyof typeof WEIGHTS],
        0,
      );
      const reasons: string[] = [];
      if (s.use === 1) reasons.push(`Built for ${a.primaryUse}`);
      if (s.phone === 1 && a.phone !== "both") reasons.push(`Full ${a.phone === "iphone" ? "iPhone" : "Android"} integration`);
      if (s.battery === 1 && a.battery >= 7) reasons.push(`Lasts ${w.batteryDays}+ days per charge`);
      if (s.features === 1 && a.features.length > 0) reasons.push("Has every feature you asked for");
      if (s.style === 1 && a.style) reasons.push(`Matches your ${a.style} style`);
      if (s.brand === 1) reasons.push(`Your preferred brand (${w.brand})`);
      if (s.budget === 1) reasons.push("Fits your budget perfectly");
      return {
        watch: w,
        score,
        matchPercent: Math.round(score * 100),
        reasons,
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.watch.year !== a.watch.year) return b.watch.year - a.watch.year;
      return a.watch.weightGrams - b.watch.weightGrams;
    });
}

export interface WatchSetup {
  primary: ScoredWatch;
  alt: ScoredWatch | null;
  budget: ScoredWatch | null;
}

export function buildSetup(a: QuizAnswers): WatchSetup {
  const scored = scoreWatches(a);
  const primary = scored[0];
  const alt =
    scored.find(
      (s) =>
        s.watch.id !== primary.watch.id &&
        s.watch.brand !== primary.watch.brand,
    ) || null;
  const budget =
    scored.find(
      (s) =>
        s.watch.id !== primary.watch.id &&
        s.watch.id !== alt?.watch.id &&
        s.watch.priceUSD < primary.watch.priceUSD * 0.7,
    ) || null;
  return { primary, alt, budget };
}