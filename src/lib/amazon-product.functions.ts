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

const TTL_MS = 60 * 60 * 1000; // 1h
const cache = new Map<string, { ts: number; product: AmazonProduct }>();

function searchUrl(brand: string, model: string): string {
  const q = encodeURIComponent(`${brand} ${model}`.trim());
  return `https://www.amazon.com/s?k=${q}&i=electronics&tag=${AMAZON_TAG}`;
}

function dpUrl(asin: string): string {
  return `https://www.amazon.com/dp/${asin}?tag=${AMAZON_TAG}`;
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
      url.searchParams.set("k", `${brand} ${model}`);
      url.searchParams.set("api_key", apiKey);
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 6000);
      const res = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
        signal: ctrl.signal,
      }).finally(() => clearTimeout(t));
      if (res.ok) {
        const data = (await res.json()) as {
          organic_results?: Array<{
            asin?: string;
            title?: string;
            link?: string;
            thumbnail?: string;
            sponsored?: boolean;
          }>;
        };
        // Prefer first non-sponsored result whose title actually mentions the brand.
        const brandLower = brand.toLowerCase();
        const candidates = (data.organic_results ?? []).filter(
          (r) => r.asin && (r.title?.toLowerCase().includes(brandLower) ?? false),
        );
        const pick = candidates.find((r) => !r.sponsored) ?? candidates[0];
        if (pick?.asin) {
          const product: AmazonProduct = {
            url: dpUrl(pick.asin),
            image: sanitizeImage(pick.thumbnail),
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
      url: searchUrl(brand, model), // safer than /dp/ with possibly-stale ASIN
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
  return src;
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
        resolveProduct(w.brand, w.model, w.asin).catch(() =>
          safeFallback(w.brand, w.model, w.asin),
        ),
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