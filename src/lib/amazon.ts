import type { Watch } from "./watch-database";

/**
 * Amazon Associates tag for gearuptofit.com.
 * Every outbound Amazon link MUST carry this tag for affiliate attribution.
 */
export const AMAZON_TAG = "papalex-20";

/**
 * Build an Amazon URL for a watch.
 * - If we have a verified ASIN, deep-link to /dp/{ASIN} so the user lands on the
 *   exact product detail page (no search disambiguation).
 * - Otherwise, fall back to a brand+model search scoped to Amazon's Sports & Outdoors
 *   category to keep the first results highly relevant.
 */
export function amazonURL(watch: Pick<Watch, "brand" | "model" | "asin">) {
  if (watch.asin) {
    return `https://www.amazon.com/dp/${watch.asin}?tag=${AMAZON_TAG}&linkCode=ogi&th=1&psc=1`;
  }
  const q = encodeURIComponent(`${watch.brand} ${watch.model}`);
  return `https://www.amazon.com/s?k=${q}&i=sporting&tag=${AMAZON_TAG}`;
}

/** Build a gearuptofit.com URL from a relative path (no leading slash). */
export function gutfURL(path: string) {
  return `https://gearuptofit.com/${path.replace(/^\//, "")}`;
}
