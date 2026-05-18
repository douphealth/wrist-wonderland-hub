import type { Metric } from "web-vitals";

const ENDPOINT = "/api/public/vitals";

function send(metric: Metric) {
  try {
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      id: metric.id,
      navigationType: metric.navigationType,
      path: typeof window !== "undefined" ? window.location.pathname : "",
      ua: typeof navigator !== "undefined" ? navigator.userAgent : "",
      ts: Date.now(),
    });
    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      const blob = new Blob([body], { type: "application/json" });
      const ok = navigator.sendBeacon(ENDPOINT, blob);
      if (ok) return;
    }
    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}

let installed = false;

export async function installWebVitals() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  try {
    const { onCLS, onINP, onLCP, onFCP, onTTFB } = await import("web-vitals");
    onCLS(send);
    onINP(send);
    onLCP(send);
    onFCP(send);
    onTTFB(send);
  } catch {
    /* ignore */
  }
}