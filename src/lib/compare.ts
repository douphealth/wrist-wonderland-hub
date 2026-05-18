import { watchDatabase, getWatchById, type Watch } from "./watch-database";

/**
 * Canonical comparison-page slug: alphabetically sorted "a-vs-b" so
 * /compare/a-vs-b and /compare/b-vs-a never both index the same content.
 */
export function buildCompareSlug(a: string, b: string): string {
  return [a, b].sort().join("-vs-");
}

export function parseCompareSlug(slug: string): [string, string] | null {
  const parts = slug.split("-vs-");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return [parts[0], parts[1]];
}

export function getCompareWatches(slug: string): { a: Watch; b: Watch } | null {
  const parsed = parseCompareSlug(slug);
  if (!parsed) return null;
  const a = getWatchById(parsed[0]);
  const b = getWatchById(parsed[1]);
  if (!a || !b || a.id === b.id) return null;
  // Always return in canonical (alphabetical) order so the UI is stable.
  return parsed[0] < parsed[1] ? { a, b } : { a: b, b: a };
}

/**
 * Curated set of watches used to pre-generate comparison pages for the
 * sitemap. We deliberately keep this small (~20 IDs → ~80 same-category
 * pairs) so we surface meaningful matchups rather than spamming the index
 * with thousands of low-intent permutations.
 */
const FEATURED_COMPARE_IDS = [
  // Smartwatches
  "apple-watch-ultra-2",
  "apple-watch-ultra-3",
  "apple-watch-series-10",
  "apple-watch-series-11",
  "apple-watch-se-2",
  "samsung-galaxy-watch-7",
  "samsung-galaxy-watch-8",
  "samsung-galaxy-watch-ultra",
  "samsung-galaxy-watch-ultra-2025",
  "google-pixel-watch-3",
  "google-pixel-watch-4",
  // Sportwatches
  "garmin-fenix-8",
  "garmin-forerunner-265",
  "garmin-forerunner-965",
  "garmin-forerunner-570",
  "garmin-forerunner-970",
  "garmin-instinct-3",
  "garmin-instinct-3-amoled",
  "coros-pace-3",
  "coros-pace-pro",
  "coros-vertix-2s",
  "polar-vantage-v3",
  "suunto-race",
  "suunto-vertical",
];

export function featuredCompareSlugs(): string[] {
  const ids = FEATURED_COMPARE_IDS.filter((id) => getWatchById(id));
  const slugs = new Set<string>();
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = getWatchById(ids[i])!;
      const b = getWatchById(ids[j])!;
      // Same-category comparisons only — "Apple Watch vs Garmin Fenix" is
      // intent-poor; "Fenix 8 vs Forerunner 965" is intent-rich.
      if (a.category !== b.category) continue;
      slugs.add(buildCompareSlug(ids[i], ids[j]));
    }
  }
  return Array.from(slugs);
}

/**
 * Pick the 3 most natural rivals for a watch — same category, closest price,
 * similar battery profile. Used to power "Compare with…" links on the
 * watch detail page and to seed internal linking for SEO.
 */
export function suggestRivals(watch: Watch, n = 3): Watch[] {
  return watchDatabase
    .filter((w) => w.id !== watch.id && w.category === watch.category)
    .map((w) => ({
      w,
      score:
        Math.abs(w.priceUSD - watch.priceUSD) / 50 +
        Math.abs(w.batteryDays - watch.batteryDays) * 0.5,
    }))
    .sort((x, y) => x.score - y.score)
    .slice(0, n)
    .map((x) => x.w);
}

export type WinnerAxis =
  | "battery"
  | "weight"
  | "price"
  | "features"
  | "water";

/** Higher-is-better axes return the watch that wins; ties return null. */
export function pickWinner(a: Watch, b: Watch, axis: WinnerAxis): Watch | null {
  switch (axis) {
    case "battery":
      return a.batteryDays === b.batteryDays ? null : a.batteryDays > b.batteryDays ? a : b;
    case "weight":
      return a.weightGrams === b.weightGrams ? null : a.weightGrams < b.weightGrams ? a : b;
    case "price":
      return a.priceUSD === b.priceUSD ? null : a.priceUSD < b.priceUSD ? a : b;
    case "features":
      return a.features.length === b.features.length
        ? null
        : a.features.length > b.features.length
          ? a
          : b;
    case "water": {
      const aATM = parseFloat(a.waterRating) || 0;
      const bATM = parseFloat(b.waterRating) || 0;
      return aATM === bATM ? null : aATM > bATM ? a : b;
    }
  }
}