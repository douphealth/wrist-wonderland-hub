import type { Watch } from "./watch-database";
import catSmartwatch from "@/assets/cat-smartwatch.jpg";
import catSportwatch from "@/assets/cat-sportwatch.jpg";
import catBand from "@/assets/cat-band.jpg";
import catHybrid from "@/assets/cat-hybrid.jpg";

/**
 * Amazon Associates tag for gearuptofit.com.
 * Every outbound Amazon link MUST carry this tag for affiliate attribution.
 */
export const AMAZON_TAG = "papalex-20";

/**
 * Amazon Associates tag per locale. Affiliate programs are region-scoped —
 * a US tag on amazon.co.uk earns nothing. We default everything to the US
 * tag and only override when an explicit per-region tag is configured.
 * Adding tags is a one-line change: register at affiliate-program.amazon.XX
 * and drop the tracking id below.
 */
const AMAZON_LOCALE_TAGS: Record<string, string> = {
  com: AMAZON_TAG, // US (papalex-20)
  // "co.uk": "yourtag-21",
  // "de": "yourtag-21",
  // "it": "yourtag-21",
  // "fr": "yourtag-21",
  // "es": "yourtag-21",
  // "ca": "yourtag-20",
};

/**
 * Map a navigator language / country code to the closest Amazon TLD that
 * actually serves the user. Unknown locales fall back to amazon.com.
 */
export function amazonHostForLocale(locale?: string | null): string {
  if (!locale) return "com";
  const lower = locale.toLowerCase();
  // Match the COUNTRY portion first (e.g. en-GB → gb), then language fallback.
  const country = lower.includes("-") ? lower.split("-")[1] : lower;
  switch (country) {
    case "gb":
    case "uk":
      return "co.uk";
    case "de":
    case "at":
    case "ch":
      return "de";
    case "it":
      return "it";
    case "fr":
    case "be":
    case "lu":
      return "fr";
    case "es":
      return "es";
    case "nl":
      return "nl";
    case "se":
      return "se";
    case "pl":
      return "pl";
    case "ca":
      return "ca";
    case "au":
      return "com.au";
    case "jp":
      return "co.jp";
    case "mx":
      return "com.mx";
    case "br":
      return "com.br";
    case "in":
      return "in";
    case "ae":
      return "ae";
    default:
      return "com";
  }
}

/**
 * Build an Amazon URL for a watch.
 *
 * We deliberately use Amazon's search endpoint (not /dp/{ASIN}) for EVERY
 * link. ASINs change, get retired, or differ by region — a hard-coded /dp/
 * link can return a 404 / "Page Not Found" page. A search URL with the
 * brand + model name + electronics category ALWAYS lands on a live Amazon
 * results page where the exact product is the first hit, with our
 * affiliate tag attributed.
 */
export function amazonURL(
  watch: Pick<Watch, "brand" | "model" | "asin">,
  opts?: { host?: string }
) {
  const host = opts?.host ?? "com";
  const tag = AMAZON_LOCALE_TAGS[host] ?? AMAZON_TAG;
  const q = encodeURIComponent(`${watch.brand} ${watch.model}`.trim());
  return `https://www.amazon.${host}/s?k=${q}&i=electronics&tag=${tag}`;
}

/** Build a gearuptofit.com URL from a relative path (no leading slash). */
export function gutfURL(path: string) {
  return `https://gearuptofit.com/${path.replace(/^\//, "")}`;
}

/**
 * Returns a hand-picked, locally-bundled hero image that reliably represents
 * the watch's category. We avoid the Amazon image widget because it requires
 * a verified ASIN, can be CORS-blocked, and silently 404s when the ASIN is
 * stale — leaving an empty image slot. A category image always renders.
 */
export function categoryImage(
  watch: Pick<Watch, "category" | "imageURL">
): string {
  if (watch.imageURL) return watch.imageURL;
  switch (watch.category) {
    case "sportwatch":
      return catSportwatch;
    case "band":
      return catBand;
    case "hybrid":
      return catHybrid;
    case "smartwatch":
    default:
      return catSmartwatch;
  }
}
