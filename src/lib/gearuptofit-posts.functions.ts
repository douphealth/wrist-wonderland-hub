import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Live posts pulled from gearuptofit.com via the WordPress REST API.
 * Cached in-memory per Worker instance for 30 minutes.
 */
export interface GutfPost {
  id: number;
  title: string;
  excerpt: string;
  link: string;
  image?: string;
  date: string;
  categories: string[];
  tags: string[];
}

const WP_BASE = "https://gearuptofit.com/wp-json/wp/v2";
const TTL_MS = 30 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;
const MAX_ATTEMPTS = 3;
const RETRY_BASE_MS = 300; // 300ms, 600ms, 1.2s

interface CacheEntry {
  ts: number;
  posts: GutfPost[];
}
const cache = new Map<string, CacheEntry>();

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&hellip;/g, "…")
    .replace(/&amp;/g, "&")
    .replace(/&#8217;/g, "’")
    .replace(/&#8220;/g, "“")
    .replace(/&#8221;/g, "”")
    .replace(/\s+/g, " ")
    .trim();
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Fetch with explicit timeout + bounded exponential backoff. Logs the full
 * failure surface (status, attempt, latency, response body snippet) so the
 * production "Latest From GearUpToFit" outage is diagnosable from Worker logs
 * without needing to repro locally.
 */
async function fetchWithRetry(url: string, label: string): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(new Error("timeout")), FETCH_TIMEOUT_MS);
    const started = Date.now();
    try {
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "WatchMatchAI/1.0 (+https://wrist-wonderland-hub.lovable.app)",
        },
        signal: ctrl.signal,
      });
      const ms = Date.now() - started;
      if (res.ok) {
        console.log(`[gutf-feed] ok attempt=${attempt} label=${label} ${res.status} ${ms}ms`);
        return res;
      }
      const body = await res.text().catch(() => "");
      const snippet = body.slice(0, 240).replace(/\s+/g, " ");
      console.error(
        `[gutf-feed] http_error attempt=${attempt}/${MAX_ATTEMPTS} label=${label} status=${res.status} ${res.statusText} ${ms}ms body=${snippet}`,
      );
      lastErr = new Error(`WP API ${res.status} ${res.statusText}`);
      // 4xx (except 429) won't get better with retries — fail fast.
      if (res.status >= 400 && res.status < 500 && res.status !== 429) throw lastErr;
    } catch (err) {
      const ms = Date.now() - started;
      const reason = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
      console.error(
        `[gutf-feed] fetch_error attempt=${attempt}/${MAX_ATTEMPTS} label=${label} ${ms}ms ${reason}`,
      );
      lastErr = err;
    } finally {
      clearTimeout(t);
    }
    if (attempt < MAX_ATTEMPTS) {
      const wait = RETRY_BASE_MS * 2 ** (attempt - 1) + Math.floor(Math.random() * 150);
      await sleep(wait);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("WP fetch failed");
}

async function fetchPosts(search: string, perPage: number): Promise<GutfPost[]> {
  const key = `${search}::${perPage}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < TTL_MS) return hit.posts;

  const url = new URL(`${WP_BASE}/posts`);
  url.searchParams.set("per_page", String(Math.min(perPage, 20)));
  url.searchParams.set("_embed", "wp:featuredmedia,wp:term");
  url.searchParams.set("_fields", "id,link,title,excerpt,date,_links,_embedded");
  if (search) url.searchParams.set("search", search);
  url.searchParams.set("orderby", "relevance");

  const res = await fetchWithRetry(url.toString(), `search="${search}"`);
  const raw = (await res.json()) as Array<Record<string, unknown>>;

  const posts: GutfPost[] = raw.map((p) => {
    const embedded = (p._embedded ?? {}) as Record<string, unknown>;
    const media = (embedded["wp:featuredmedia"] as Array<{ source_url?: string }> | undefined)?.[0];
    const terms = (embedded["wp:term"] as Array<Array<{ name: string; taxonomy: string }>> | undefined) ?? [];
    const flat = terms.flat();
    return {
      id: p.id as number,
      title: stripHtml(((p.title as { rendered?: string })?.rendered) ?? ""),
      excerpt: stripHtml(((p.excerpt as { rendered?: string })?.rendered) ?? "").slice(0, 180),
      link: p.link as string,
      image: media?.source_url,
      date: p.date as string,
      categories: flat.filter((t) => t.taxonomy === "category").map((t) => t.name),
      tags: flat.filter((t) => t.taxonomy === "post_tag").map((t) => t.name),
    };
  });

  cache.set(key, { ts: Date.now(), posts });
  return posts;
}

export const getRelevantGutfPosts = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      keywords: z.array(z.string().min(1).max(60)).max(8).default([]),
      limit: z.number().int().min(1).max(12).default(6),
    })
  )
  .handler(async ({ data }) => {
    const started = Date.now();
    const queries = data.keywords.length > 0 ? data.keywords : ["smartwatch"];
    const all = new Map<number, GutfPost>();
    const failures: string[] = [];

    // Try every keyword independently — a single bad query (e.g. a rare brand
    // name not indexed by WP search) must not nuke the whole feed.
    for (const q of queries.slice(0, 4)) {
      try {
        const posts = await fetchPosts(q, data.limit);
        for (const p of posts) all.set(p.id, p);
        if (all.size >= data.limit * 2) break;
      } catch (err) {
        failures.push(`${q}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // Always-on safety net — guarantees the section never renders empty
    // unless WP itself is fully down.
    if (all.size === 0) {
      for (const q of ["smartwatch", "watch", "fitness tracker"]) {
        try {
          const fallback = await fetchPosts(q, data.limit);
          for (const p of fallback) all.set(p.id, p);
          if (all.size > 0) break;
        } catch (err) {
          failures.push(`fallback ${q}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }

    const ms = Date.now() - started;
    if (all.size === 0) {
      console.error(
        `[gutf-feed] zero_posts total=${ms}ms failures=${failures.join(" | ")}`,
      );
      return {
        posts: [] as GutfPost[],
        error: "Could not load latest GearUpToFit guides.",
        diagnostics: { ms, failures },
      };
    }
    if (failures.length > 0) {
      console.warn(
        `[gutf-feed] partial total=${ms}ms got=${all.size} failures=${failures.join(" | ")}`,
      );
    }
    return {
      posts: Array.from(all.values()).slice(0, data.limit),
      error: null as string | null,
      diagnostics: { ms, failures },
    };
  });
