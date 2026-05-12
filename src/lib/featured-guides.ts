import type { QuizAnswers } from "./quiz-data";

export interface Guide {
  title: string;
  blurb: string;
  path: string; // relative to gearuptofit.com
}

/** Verified, currently-published GearUpToFit guides, hand-mapped to quiz contexts. */
const ALL_GUIDES: (Guide & { match: (a: QuizAnswers) => number })[] = [
  {
    title: "Best GPS Running Watches for Marathon Beginners",
    blurb: "Race-day pacing, training load and battery picks under one cover.",
    path: "review/best-gps-running-watches-for-marathon-beginners",
    match: (a) => (a.primaryUse === "running" ? 5 : 1),
  },
  {
    title: "Best Smartwatches for Runners",
    blurb: "Curated picks across Garmin, Coros, Polar and Apple for serious runners.",
    path: "review/best-smartwatches-for-runners",
    match: (a) => (a.primaryUse === "running" ? 4 : 1),
  },
  {
    title: "Best Sports Watches for Interval Training",
    blurb: "Workout structuring, lap alerts and HR zones — what actually matters.",
    path: "review/best-sports-watches-for-interval-training",
    match: (a) => (a.primaryUse === "gym" || a.primaryUse === "running" ? 3 : 0),
  },
  {
    title: "Best Smartwatches for Cycling in 2024",
    blurb: "Power-meter pairing, navigation and incident detection compared.",
    path: "review/best-smartwatches-for-cycling-in-2024",
    match: (a) => (a.primaryUse === "multisport" || a.primaryUse === "outdoor" ? 3 : 0),
  },
  {
    title: "Best Sports Watches for Swimming",
    blurb: "Pool, openwater and triathlon-grade water resistance picks.",
    path: "review/sports-watch/best-sports-watches-for-swimming-dive-into-the-top-picks",
    match: (a) => (a.features.includes("swim") || a.primaryUse === "multisport" ? 3 : 0),
  },
  {
    title: "Best Smartwatches for Weightlifters",
    blurb: "Rep counting, recovery scores and rugged builds for the gym floor.",
    path: "review/best-smartwatches-for-weightlifters",
    match: (a) => (a.primaryUse === "gym" ? 4 : 0),
  },
  {
    title: "Apple Watch vs Garmin",
    blurb: "The eternal question, settled with real-world battery and accuracy data.",
    path: "review/apple-watch-vs-garmin",
    match: (a) => (a.brand.includes("apple") || a.brand.includes("garmin") ? 3 : 1),
  },
  {
    title: "Best Budget Smartwatches for Fitness Tracking",
    blurb: "How to spend less than $200 without giving up GPS or heart-rate.",
    path: "review/best-budget-smartwatches-for-fitness-tracking",
    match: (a) => (a.budget.includes("under-100") || a.budget.includes("100-250") ? 4 : 0),
  },
  {
    title: "Best Fitness Trackers",
    blurb: "Slim bands and hybrids — what to wear when you don't want a watch.",
    path: "review/best-fitness-trackers",
    match: (a) => (a.form === "band" || a.form === "hybrid" ? 4 : 1),
  },
  {
    title: "Best Smartwatches for Seniors",
    blurb: "Fall detection, ECG, large fonts and cellular options worth knowing.",
    path: "review/best-smartwatches-for-seniors",
    match: (a) => (a.features.includes("ecg") && a.style === "minimal" ? 3 : 0),
  },
  {
    title: "10 Health Benefits of Wearing a Fitness Tracker",
    blurb: "The behavioural-science case for daily wear, backed by studies.",
    path: "fitness/10-health-benefits-of-wearing-a-fitness-tracker",
    match: (a) => (a.primaryUse === "health" || a.primaryUse === "everyday" ? 3 : 1),
  },
  {
    title: "Best Sports Watches for Women",
    blurb: "Smaller cases, cycle tracking and stylish bands without compromise.",
    path: "review/best-sports-watches-for-women-in-2024",
    match: (a) => (a.wristSize <= 160 ? 3 : 1),
  },
  {
    title: "The Best Smartwatches (Master Roundup)",
    blurb: "Our flagship buyer's guide — updated continuously.",
    path: "review/the-best-smartwatches",
    match: () => 2,
  },
];

export function pickGuides(answers: QuizAnswers, n = 4): Guide[] {
  return [...ALL_GUIDES]
    .map((g, index) => ({ g, index, score: g.match(answers) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, n)
    .map(({ g }) => ({ title: g.title, blurb: g.blurb, path: g.path }));
}
