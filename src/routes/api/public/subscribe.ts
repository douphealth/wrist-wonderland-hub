import { createFileRoute } from "@tanstack/react-router";
import { brevoSubscribeSchema, runBrevoSubscribe } from "@/lib/brevo-core.server";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
} as const;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

export const Route = createFileRoute("/api/public/subscribe")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        try {
          const raw = await request.json().catch(() => null);
          const parsed = brevoSubscribeSchema.safeParse(raw);
          if (!parsed.success) {
            return json({ success: false, error: "Invalid input" }, 400);
          }
          const result = await runBrevoSubscribe(parsed.data);
          return json(result, result.success ? 200 : 502);
        } catch (err) {
          console.error("/api/public/subscribe error", err);
          return json({ success: false, error: "Server error" }, 500);
        }
      },
    },
  },
});
