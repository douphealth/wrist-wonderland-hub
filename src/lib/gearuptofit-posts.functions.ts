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

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`WP API ${res.status}`);
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
    try {
      // Try keyword search first; fall back to recent smartwatch posts.
      const queries = data.keywords.length > 0 ? data.keywords : ["smartwatch"];
      const all = new Map<number, GutfPost>();
      for (const q of queries.slice(0, 4)) {
        const posts = await fetchPosts(q, data.limit);
        for (const p of posts) all.set(p.id, p);
        if (all.size >= data.limit * 2) break;
      }
      if (all.size === 0) {
        const fallback = await fetchPosts("watch", data.limit);
        for (const p of fallback) all.set(p.id, p);
      }
      return {
        posts: Array.from(all.values()).slice(0, data.limit),
        error: null as string | null,
      };
    } catch (err) {
      console.error("gearuptofit posts fetch failed", err);
      return { posts: [] as GutfPost[], error: "Could not load latest GearUpToFit guides." };
    }
  });
