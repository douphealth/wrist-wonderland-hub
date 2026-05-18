import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Clock, Timer } from "lucide-react";
import { getReportExpiry } from "@/lib/report-expiry.functions";

/**
 * Live countdown badge — server-issued 24h expiry on the personalized report.
 * The expiresAt timestamp is set in an HttpOnly cookie by the server fn, so
 * the deadline is consistent across reloads and devices on the same session.
 */
export default function ReportExpiryBadge({ slug }: { slug: string }) {
  const fetchExpiry = useServerFn(getReportExpiry);
  const { data } = useQuery({
    queryKey: ["report-expiry", slug],
    queryFn: () => fetchExpiry({ data: { slug } }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!data) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-primary/20 text-[10px] uppercase tracking-widest text-muted-foreground">
        <Clock className="w-3 h-3 text-primary animate-pulse" />
        Locking your report…
      </div>
    );
  }

  const remaining = Math.max(0, data.expiresAt - now);
  const totalSec = Math.floor(remaining / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const expired = remaining <= 0;
  const urgent = !expired && remaining < 60 * 60 * 1000; // under 1h

  return (
    <div
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full glass border ${
        expired
          ? "border-destructive/50 text-destructive"
          : urgent
            ? "border-primary/60 text-primary"
            : "border-primary/25 text-foreground/90"
      }`}
    >
      <Timer className={`w-3.5 h-3.5 ${urgent && !expired ? "text-primary animate-pulse" : "text-primary"}`} />
      <span className="text-[10px] uppercase tracking-[0.18em] font-semibold">
        {expired ? "Report expired — re-take quiz" : "Personalized report expires in"}
      </span>
      {!expired && (
        <span className="font-mono tabular-nums text-xs font-bold tracking-tight">
          {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
        </span>
      )}
    </div>
  );
}