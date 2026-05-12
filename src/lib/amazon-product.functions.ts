import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const AMAZON_TAG = "papalex-20";

export interface AmazonProduct {
  /** Direct product URL (https://www.amazon.com/dp/ASIN?tag=...). Falls back to a tagged search URL. */
  url: string;
  /** Product image URL from Amazon CDN. May be null when SerpApi is unavailable. */
  image: string | null;
  /** Resolved ASIN (from SerpApi or hard-coded fallback). */
  asin: string | null;
  /** Verified product title from Amazon. */
  title: string | null;
  /** "serpapi" when fetched live, "fallback" when we used the curated ASIN, "search" when nothing matched. */
  source: "serpapi" | "fallback" | "search";
}

type SerpApiResult = {
  asin?: string;
  title?: string;
  link?: string;
  thumbnail?: string;
  image?: string;
  sponsored?: boolean;
  rating?: number;
  reviews?: number;
  price?: { raw?: string; value?: number } | string;
};

const TTL_MS = 24 * 60 * 60 * 1000; // 24h — conserve SerpApi quota across repeat quiz/result views.
const cache = new Map<string, { ts: number; product: AmazonProduct }>();

const ACCESSORY_RE = /\b(cable|charger|charging|cord|adapter|dock|cradle|screen\s*protector|protector|tempered\s*glass|hydrogel|film|case|cover|bezel|strap|band|replacement|holder|mount|stand|dust\s*plug|compatible\s+(?:with|for))\b/i;
const PRODUCT_CLASS_RE = /\b(smart\s*watch|smartwatch|sport\s*watch|sports\s*watch|gps\s*(?:watch|sports)|fitness\s*tracker|activity\s*tracker|wearable)\b/i;

function variantPenalty(title: string, model: string): number {
  const t = normalize(title);
  const m = normalize(model);
  if (m === "vantage v3" && /\bvantage\s+(m3|v2|v)\b/.test(t)) return -140;
  if (m === "race" && /\brace\s+(s|2)\b/.test(t)) return -110;
  if (m === "t rex 3" && /\bt\s*rex\s*3\s*pro\b/.test(t)) return -70;
  if (m === "watch series 10" && /\bseries\s+(?:9|8|7|se)\b/.test(t)) return -120;
  return 0;
}

function searchUrl(brand: string, model: string): string {
  const q = encodeURIComponent(`${brand} ${model} watch`.trim());
  return `https://www.amazon.com/s?k=${q}&i=electronics&tag=${AMAZON_TAG}`;
}

function dpUrl(asin: string): string {
  return `https://www.amazon.com/dp/${asin}?tag=${AMAZON_TAG}`;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function modelTokens(model: string): string[] {
  return normalize(model)
    .split(" ")
    .filter((t) => !new Set(["watch", "smartwatch", "gps", "lte", "gen", "edition"]).has(t));
}

function scoreResult(result: SerpApiResult, brand: string, model: string): number {
  const rawTitle = result.title ?? "";
  const title = normalize(rawTitle);
  const brandText = normalize(brand);
  const tokens = modelTokens(model);
  let score = 0;
  if (!result.asin || !title) return -100;
  if (ACCESSORY_RE.test(rawTitle)) return -1000;
  if (!PRODUCT_CLASS_RE.test(rawTitle)) score -= 35;
  score += variantPenalty(rawTitle, model);
  if (title.includes(brandText)) score += 45;
  else score += tokens.length > 0 && tokens.every((t) => title.includes(t)) ? 8 : -45;
  const matched = tokens.filter((t) => title.includes(t)).length;
  if (tokens.length > 0 && matched < tokens.length) score -= 80;
  score += matched * 18;
  if (matched === tokens.length && tokens.length > 0) score += 25;
  if (result.thumbnail || result.image) score += 12;
  if (result.rating && result.rating >= 4) score += 4;
  if (result.reviews && result.reviews >= 50) score += 4;
  if (result.sponsored) score -= 8;
  if (/\b(kids|toy|renewed|refurbished|used)\b/.test(title)) score -= 40;
  return score;
}

function pickBest(results: SerpApiResult[] | undefined, brand: string, model: string): SerpApiResult | undefined {
  const scored = (results ?? [])
    .map((r) => ({ result: r, score: scoreResult(r, brand, model) }))
    .filter(({ score }) => score >= 45)
    .sort((a, b) => b.score - a.score);
  return scored[0]?.result;
}

function cacheKey(brand: string, model: string) {
  return `${brand}::${model}`.toLowerCase();
}

/**
 * Resolve a watch's verified Amazon product page + product image via SerpApi.
 *
 * Why SerpApi: hard-coded ASINs go stale and a /dp/{ASIN} link to a removed
 * listing returns a 404. SerpApi's `engine=amazon` returns the current top
 * organic result for a query — the live first hit, with its real ASIN and
 * thumbnail. We re-stamp the URL with our affiliate tag.
 *
 * Cascade:
 *   1. SerpApi `engine=amazon` (best — real product page + product image)
 *   2. Curated ASIN from the watch database (deep-link, category image fallback)
 *   3. Tagged Amazon search URL (always lands on a live results page)
 */
async function resolveProduct(
  brand: string,
  model: string,
  fallbackAsin?: string,
): Promise<AmazonProduct> {
  const key = cacheKey(brand, model);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < TTL_MS) return hit.product;

  const apiKey = process.env.SERPAPI_API_KEY;
  if (apiKey) {
    try {
      const url = new URL("https://serpapi.com/search.json");
      url.searchParams.set("engine", "amazon");
      url.searchParams.set("amazon_domain", "amazon.com");
      url.searchParams.set("k", `${brand} ${model} watch`);
      url.searchParams.set("api_key", apiKey);
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 6000);
      const res = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
        signal: ctrl.signal,
      }).finally(() => clearTimeout(t));
      if (res.ok) {
        const data = (await res.json()) as { organic_results?: SerpApiResult[] };
        const pick = pickBest(data.organic_results, brand, model);
        if (pick?.asin) {
          const product: AmazonProduct = {
            url: dpUrl(pick.asin),
            image: sanitizeImage(pick.thumbnail ?? pick.image),
            asin: pick.asin,
            title: pick.title ?? null,
            source: "serpapi",
          };
          cache.set(key, { ts: Date.now(), product });
          return product;
        }
      } else {
        console.error(`SerpApi amazon search failed [${res.status}] for ${brand} ${model}`);
      }
    } catch (err) {
      console.error(
        `SerpApi amazon search threw for ${brand} ${model}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  // Fallback to curated ASIN if available.
  if (fallbackAsin) {
    const product: AmazonProduct = {
      url: searchUrl(brand, model),
      image: null,
      asin: fallbackAsin,
      title: null,
      source: "fallback",
    };
    cache.set(key, { ts: Date.now(), product });
    return product;
  }

  const product: AmazonProduct = {
    url: searchUrl(brand, model),
    image: null,
    asin: null,
    title: null,
    source: "search",
  };
  cache.set(key, { ts: Date.now(), product });
  return product;
}

/** Only accept absolute https image URLs from Amazon-like CDNs. */
function sanitizeImage(src: string | undefined | null): string | null {
  if (!src || typeof src !== "string") return null;
  if (!/^https:\/\//i.test(src)) return null;
  return src.replace(/\._[A-Z0-9_,]+_\./i, "._AC_SL1500_.");
}

function safeFallback(brand: string, model: string, asin?: string): AmazonProduct {
  return {
    url: searchUrl(brand, model),
    image: null,
    asin: asin ?? null,
    title: null,
    source: "search",
  };
}

const watchInput = z.object({
  brand: z.string().min(1).max(60),
  model: z.string().min(1).max(80),
  asin: z.string().min(8).max(20).optional(),
  imageURL: z.string().url().optional(),
});

export const getAmazonProducts = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      watches: z.array(watchInput).min(1).max(10),
    }),
  )
  .handler(async ({ data }) => {
    // Use allSettled + per-item try/catch so a single failure never produces a 500.
    const settled = await Promise.allSettled(
      data.watches.map((w) =>
        (async () => {
          // Short-circuit: when the curated database supplies a verified image
          // (and ideally an ASIN) we skip SerpApi entirely to conserve quota.
          if (w.imageURL) {
            return {
              url: w.asin ? dpUrl(w.asin) : searchUrl(w.brand, w.model),
              image: w.imageURL,
              asin: w.asin ?? null,
              title: null,
              source: "fallback" as const,
            };
          }
          return resolveProduct(w.brand, w.model, w.asin).catch(() =>
            safeFallback(w.brand, w.model, w.asin),
          );
        })(),
      ),
    );
    return {
      products: data.watches.map((w, i) => {
        const r = settled[i];
        const product =
          r.status === "fulfilled" ? r.value : safeFallback(w.brand, w.model, w.asin);
        return {
          key: `${w.brand}::${w.model}`.toLowerCase(),
          product,
        };
      }),
    };
  });