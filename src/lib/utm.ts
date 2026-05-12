// Lightweight UTM capture. Captures on first landing, persists for the session
// so every subsequent lead-capture event is tagged with the original source.

export interface UTM {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
  referrer?: string;
  landing?: string;
}

const KEY = "wm_utm_v1";

export function captureUTM(): void {
  if (typeof window === "undefined") return;
  try {
    if (sessionStorage.getItem(KEY)) return;
    const p = new URLSearchParams(window.location.search);
    const utm: UTM = {
      source: p.get("utm_source") || undefined,
      medium: p.get("utm_medium") || undefined,
      campaign: p.get("utm_campaign") || undefined,
      term: p.get("utm_term") || undefined,
      content: p.get("utm_content") || undefined,
      referrer: document.referrer || undefined,
      landing: window.location.pathname || undefined,
    };
    sessionStorage.setItem(KEY, JSON.stringify(utm));
  } catch {
    // sessionStorage unavailable — silently ignore.
  }
}

export function getUTM(): UTM {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as UTM) : {};
  } catch {
    return {};
  }
}