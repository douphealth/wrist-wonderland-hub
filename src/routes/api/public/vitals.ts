import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Schema = z.object({
  name: z.enum(["CLS", "INP", "LCP", "FCP", "TTFB"]),
  value: z.number().finite(),
  rating: z.enum(["good", "needs-improvement", "poor"]).optional(),
  id: z.string().min(1).max(120).optional(),
  navigationType: z.string().max(40).optional(),
  path: z.string().max(255).optional(),
  ua: z.string().max(500).optional(),
  ts: z.number().int().optional(),
});

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
} as const;

export const Route = createFileRoute("/api/public/vitals")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        try {
          const raw = await request.json().catch(() => null);
          const parsed = Schema.safeParse(raw);
          if (!parsed.success) {
            return new Response(null, { status: 204, headers: CORS });
          }
          // Structured log — picked up by server-function-logs / Worker logs.
          // Cheap, sampled by browser already (web-vitals fires once per metric).
          console.log(
            JSON.stringify({
              kind: "web_vital",
              ...parsed.data,
            }),
          );
          return new Response(null, { status: 204, headers: CORS });
        } catch {
          return new Response(null, { status: 204, headers: CORS });
        }
      },
    },
  },
});