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
 * Build an Amazon URL for a watch.
 *
 * We deliberately use Amazon's search endpoint (not /dp/{ASIN}) for EVERY
 * link. ASINs change, get retired, or differ by region — a hard-coded /dp/
 * link can return a 404 / "Page Not Found" page. A search URL with the
 * brand + model name + electronics category ALWAYS lands on a live Amazon
 * results page where the exact product is the first hit, with our
 * affiliate tag attributed.
 */
export function amazonURL(watch: Pick<Watch, "brand" | "model" | "asin">) {
  const q = encodeURIComponent(`${watch.brand} ${watch.model}`.trim());
  return `https://www.amazon.com/s?k=${q}&i=electronics&tag=${AMAZON_TAG}`;
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
