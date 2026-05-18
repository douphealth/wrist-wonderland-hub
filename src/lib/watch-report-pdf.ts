import jsPDF from "jspdf";
import type { QuizAnswers } from "./quiz-data";
import type { WatchRecommendation } from "./recommendation-engine";
import type { ScoredWatch, WatchSetup } from "./scoring-engine";
import { WATCH_DB_LAST_UPDATED, watchDatabase, type Watch } from "./watch-database";
import { amazonURL, categoryImage, gutfURL } from "./amazon";

type RGB = readonly [number, number, number];

// ─── Brand palette (matches RunMatch / GearUpToFit) ───
const C = {
  red: [200, 30, 30] as const,
  redLight: [220, 50, 50] as const,
  redBg: [255, 240, 240] as const,
  dark: [30, 30, 35] as const,
  text: [40, 40, 50] as const,
  textLight: [100, 105, 115] as const,
  textMuted: [140, 145, 155] as const,
  white: [255, 255, 255] as const,
  bg: [250, 250, 252] as const,
  cardBg: [255, 255, 255] as const,
  border: [220, 222, 228] as const,
  green: [25, 160, 80] as const,
  greenBg: [235, 250, 240] as const,
  blue: [30, 100, 200] as const,
  blueBg: [235, 245, 255] as const,
  purple: [100, 60, 180] as const,
  purpleBg: [245, 240, 255] as const,
  accent: [230, 160, 30] as const,
  accentBg: [255, 248, 230] as const,
};

const PW = 210;
const PH = 297;
const M = 16;
const CW = PW - M * 2;

/**
 * Strip combining marks (e.g. Garmin "fēnix" → "fenix") and other
 * non-Latin-1 codepoints that jsPDF's default Helvetica can't render —
 * those would otherwise drop out and leave visible gaps like "f nix".
 */
function asciiSafe(s: string): string {
  if (!s) return s;
  return s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2022/g, "*")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");
}

// ─── Primitives ───
function rr(doc: jsPDF, x: number, y: number, w: number, h: number, r: number, fill: RGB, stroke?: RGB) {
  doc.setFillColor(fill[0], fill[1], fill[2]);
  if (stroke) {
    doc.setDrawColor(stroke[0], stroke[1], stroke[2]);
    doc.setLineWidth(0.4);
  }
  if (typeof (doc as any).roundedRect === "function") {
    (doc as any).roundedRect(x, y, w, h, r, r, stroke ? "FD" : "F");
  } else {
    doc.rect(x, y, w, h, stroke ? "FD" : "F");
  }
}

function pill(doc: jsPDF, x: number, y: number, text: string, bg: RGB, fg: RGB) {
  const tw = doc.getTextWidth(text) + 6;
  rr(doc, x, y, tw, 6, 3, bg);
  doc.setFontSize(5.5);
  doc.setTextColor(fg[0], fg[1], fg[2]);
  doc.setFont("helvetica", "bold");
  doc.text(text, x + 3, y + 4.2);
  return tw;
}

function sectionTitle(doc: jsPDF, y: number, title: string, color: RGB = C.red): number {
  doc.setFillColor(color[0], color[1], color[2]);
  doc.rect(M, y, 3, 8, "F");
  doc.setFontSize(11);
  doc.setTextColor(C.dark[0], C.dark[1], C.dark[2]);
  doc.setFont("helvetica", "bold");
  doc.text(title, M + 7, y + 6);
  return y + 12;
}

function labelValue(doc: jsPDF, x: number, y: number, label: string, value: string, maxW = 35) {
  doc.setFontSize(5);
  doc.setTextColor(C.textMuted[0], C.textMuted[1], C.textMuted[2]);
  doc.setFont("helvetica", "bold");
  doc.text(label, x, y, { charSpace: 0.4 } as any);
  // Auto-fit: shrink font progressively, then wrap to a second line if still needed.
  doc.setTextColor(C.dark[0], C.dark[1], C.dark[2]);
  doc.setFont("helvetica", "bold");
  let fs = 7.5;
  doc.setFontSize(fs);
  while (doc.getTextWidth(value) > maxW && fs > 6) {
    fs -= 0.25;
    doc.setFontSize(fs);
  }
  const lines = doc.splitTextToSize(value, maxW) as string[];
  doc.text(lines.slice(0, 2), x, y + 4.5);
}

function link(doc: jsPDF, x: number, y: number, text: string, url: string, size = 6.5) {
  doc.setFontSize(size);
  doc.setTextColor(C.red[0], C.red[1], C.red[2]);
  doc.setFont("helvetica", "bold");
  const safe = asciiSafe(text);
  doc.textWithLink(safe, x, y, { url });
  const tw = doc.getTextWidth(safe);
  // Lift the icon so its bottom sits comfortably above the text baseline,
  // clear of descenders and not visually "underlining" the link.
  drawLinkIcon(doc, x + tw + 1.2, y - size * 0.62, size * 0.32);
}

function drawRadar(doc: jsPDF, cx: number, cy: number, radius: number, data: { axis: string; value: number }[]) {
  const n = data.length;
  const step = (2 * Math.PI) / n;
  const start = -Math.PI / 2;
  for (let ring = 1; ring <= 5; ring++) {
    const r = (radius * ring) / 5;
    doc.setDrawColor(C.border[0], C.border[1], C.border[2]);
    doc.setLineWidth(0.15);
    const pts: [number, number][] = [];
    for (let i = 0; i <= n; i++) {
      const a = start + (i % n) * step;
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    for (let i = 0; i < pts.length - 1; i++) doc.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
  }
  for (let i = 0; i < n; i++) {
    const a = start + i * step;
    doc.setDrawColor(C.border[0], C.border[1], C.border[2]);
    doc.setLineWidth(0.15);
    doc.line(cx, cy, cx + radius * Math.cos(a), cy + radius * Math.sin(a));
  }
  const dp: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = start + i * step;
    const r = (radius * data[i].value) / 10;
    dp.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  doc.setDrawColor(C.red[0], C.red[1], C.red[2]);
  doc.setLineWidth(0.7);
  for (let i = 0; i < dp.length; i++) {
    const next = (i + 1) % dp.length;
    doc.line(dp[i][0], dp[i][1], dp[next][0], dp[next][1]);
  }
  for (const p of dp) {
    doc.setFillColor(C.red[0], C.red[1], C.red[2]);
    doc.circle(p[0], p[1], 1.3, "F");
    doc.setFillColor(255, 255, 255);
    doc.circle(p[0], p[1], 0.6, "F");
  }
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  for (let i = 0; i < n; i++) {
    const a = start + i * step;
    const lr = radius + 7;
    const lx = cx + lr * Math.cos(a);
    const ly = cy + lr * Math.sin(a);
    const align = Math.abs(Math.cos(a)) < 0.3 ? "center" : Math.cos(a) > 0 ? "left" : "right";
    doc.setTextColor(C.text[0], C.text[1], C.text[2]);
    doc.text(data[i].axis, lx, ly + 1, { align: align as any });
    doc.setFontSize(5);
    doc.setTextColor(C.red[0], C.red[1], C.red[2]);
    doc.text(`${data[i].value}/10`, lx, ly + 4.5, { align: align as any });
    doc.setFontSize(6.5);
  }
}

// ─── Image loading (logo + product photos) ───
type LoadedImage = { data: string; format: "JPEG" | "PNG"; w: number; h: number };

/**
 * Bump Amazon CDN thumbnails to a large, square-canvas variant so SERP
 * thumbs (often 160-320px) don't render blurry inside the PDF.
 */
function upgradeAmazonImage(url: string): string {
  if (!/\.(media-)?amazon\.|ssl-images-amazon|images-na\.ssl/i.test(url)) return url;
  return url
    .replace(/\._[A-Z0-9_,]+_\./i, "._AC_SL1500_.")
    .replace(/(\/I\/[^.]+)\.(jpg|jpeg|png)/i, "$1._AC_SL1500_.$2");
}

async function urlToDataUrl(url: string): Promise<LoadedImage | null> {
  try {
    const finalUrl = upgradeAmazonImage(url);
    const r = await fetch(finalUrl, { mode: "cors" });
    if (!r.ok) return null;
    const blob = await r.blob();
    if (blob.size < 1500) return null;
    const data = await new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onloadend = () => resolve(fr.result as string);
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
    const format: "JPEG" | "PNG" = blob.type.includes("png") ? "PNG" : "JPEG";
    // Measure natural dimensions so we can letterbox (contain-fit) without distortion.
    const dims = await new Promise<{ w: number; h: number }>((resolve) => {
      if (typeof Image === "undefined") return resolve({ w: 1, h: 1 });
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth || 1, h: img.naturalHeight || 1 });
      img.onerror = () => resolve({ w: 1, h: 1 });
      img.src = data;
    });
    return { data, format, w: dims.w, h: dims.h };
  } catch {
    return null;
  }
}

/**
 * Draw `img` inside the box (x,y,w,h) preserving its aspect ratio (object-fit: contain).
 * Prevents the squashed/stretched look caused by jsPDF's default stretch-to-fill.
 */
function drawImageContained(
  doc: jsPDF,
  img: LoadedImage,
  x: number, y: number, w: number, h: number,
) {
  const ar = img.w / img.h;
  const boxAr = w / h;
  let dw = w, dh = h;
  if (ar > boxAr) {
    dw = w;
    dh = w / ar;
  } else {
    dh = h;
    dw = h * ar;
  }
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) / 2;
  doc.addImage(img.data, img.format, dx, dy, dw, dh, undefined, "SLOW");
}

/** Tiny external-link glyph drawn as vector (a square with an arrow). */
function drawLinkIcon(doc: jsPDF, x: number, y: number, size = 2.2, color: RGB = C.red) {
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(0.25);
  // square (open at top-right)
  doc.line(x, y, x, y + size);
  doc.line(x, y + size, x + size, y + size);
  doc.line(x + size, y + size, x + size, y + size * 0.45);
  // arrow shaft
  doc.line(x + size * 0.45, y + size * 0.55, x + size + 0.6, y - 0.2);
  // arrow head
  doc.line(x + size + 0.6, y - 0.2, x + size * 0.55, y - 0.2);
  doc.line(x + size + 0.6, y - 0.2, x + size + 0.6, y + size * 0.55);
}

// ─── Page chrome ───
function addHeader(doc: jsPDF, logoData: string | null) {
  doc.setFillColor(C.red[0], C.red[1], C.red[2]);
  doc.rect(0, 0, PW, 2.5, "F");

  if (logoData) {
    try { doc.addImage(logoData, "PNG", M, 4, 12, 12); } catch { /* ignore */ }
  }
  doc.setFontSize(8);
  doc.setTextColor(C.red[0], C.red[1], C.red[2]);
  doc.setFont("helvetica", "bold");
  doc.text("GEAR UP TO FIT", M + (logoData ? 14 : 0), 11);

  doc.setFontSize(5.5);
  doc.setTextColor(C.textMuted[0], C.textMuted[1], C.textMuted[2]);
  doc.setFont("helvetica", "normal");
  doc.textWithLink("gearuptofit.com", M + (logoData ? 14 : 0), 15, { url: "https://gearuptofit.com/" });

  doc.setFontSize(7);
  doc.setTextColor(C.red[0], C.red[1], C.red[2]);
  doc.setFont("helvetica", "bold");
  doc.text("WATCHMATCH AI", PW - M, 11, { align: "right" });

  doc.setFontSize(5.5);
  doc.setTextColor(C.textMuted[0], C.textMuted[1], C.textMuted[2]);
  doc.setFont("helvetica", "normal");
  doc.text("Personalized Smartwatch Report", PW - M, 15, { align: "right" });

  doc.setDrawColor(C.border[0], C.border[1], C.border[2]);
  doc.setLineWidth(0.4);
  doc.line(M, 19, PW - M, 19);
}

function addFooter(doc: jsPDF, page: number, total: number) {
  doc.setDrawColor(C.border[0], C.border[1], C.border[2]);
  doc.setLineWidth(0.3);
  doc.line(M, PH - 16, PW - M, PH - 16);
  doc.setFontSize(5);
  doc.setTextColor(C.textMuted[0], C.textMuted[1], C.textMuted[2]);
  doc.setFont("helvetica", "normal");
  doc.text("Generated by WatchMatch AI  |  gearuptofit.com  |  Gear Up. Show Up. Level Up.", M, PH - 11);
  doc.text(`Page ${page} of ${total}`, PW - M, PH - 11, { align: "right" });
  doc.setFontSize(4.5);
  doc.text("Independent editorial — not medical advice. As an Amazon Associate, GearUpToFit earns from qualifying purchases. Database verified " + WATCH_DB_LAST_UPDATED + ".", M, PH - 7);
  doc.setFillColor(C.red[0], C.red[1], C.red[2]);
  doc.rect(0, PH - 2.5, PW, 2.5, "F");
}

// ─── Product image frame ───
function drawWatchFrame(
  doc: jsPDF,
  x: number, y: number, w: number, h: number,
  img: LoadedImage | null,
  brand: string, model: string,
) {
  // Soft shadow
  doc.setFillColor(0, 0, 0);
  (doc as any).setGState && (doc as any).setGState(new (doc as any).GState({ opacity: 0.06 }));
  if (typeof (doc as any).roundedRect === "function") (doc as any).roundedRect(x + 0.6, y + 0.8, w, h, 2, 2, "F");
  else doc.rect(x + 0.6, y + 0.8, w, h, "F");
  (doc as any).setGState && (doc as any).setGState(new (doc as any).GState({ opacity: 1 }));

  rr(doc, x, y, w, h, 2, [248, 249, 251], C.border);

  doc.setFillColor(0, 0, 0);
  (doc as any).setGState && (doc as any).setGState(new (doc as any).GState({ opacity: 0.08 }));
  doc.ellipse(x + w / 2, y + h - 2.5, w * 0.32, 1.1, "F");
  (doc as any).setGState && (doc as any).setGState(new (doc as any).GState({ opacity: 1 }));

  if (img) {
    const pad = 1.5;
    try {
      drawImageContained(doc, img, x + pad, y + pad, w - pad * 2, h - pad * 2 - 1.5);
      return;
    } catch { /* fall through to placeholder */ }
  }
  doc.setFontSize(5.5);
  doc.setTextColor(C.red[0], C.red[1], C.red[2]);
  doc.setFont("helvetica", "bold");
  doc.text(brand.toUpperCase(), x + w / 2, y + h / 2 - 1, { align: "center" });
  doc.setFontSize(7);
  doc.setTextColor(C.dark[0], C.dark[1], C.dark[2]);
    const lines = doc.splitTextToSize(asciiSafe(model), w - 4);
  doc.text(lines.slice(0, 2), x + w / 2, y + h / 2 + 3, { align: "center" });
}

// ─── GearUpToFit content links ───
const READ_BEFORE_BUY = [
  { title: "How to Choose the Right Smartwatch", url: gutfURL("review/best-smartwatches/") },
  { title: "Best Smartwatches 2026", url: gutfURL("review/best-smartwatches/") },
  { title: "Best Smartwatches for Runners", url: gutfURL("review/best-smartwatches-for-runners/") },
  { title: "Best Fitness Trackers", url: gutfURL("review/best-fitness-trackers/") },
];

function articlesFor(a: QuizAnswers): { title: string; category: string; url: string }[] {
  const out: { title: string; category: string; url: string }[] = [];
  if (a.primaryUse === "running") {
    out.push({ category: "RUNNING", title: "Best GPS Watches for Runners", url: gutfURL("review/best-smartwatches-for-runners/") });
    out.push({ category: "TRAINING", title: "Free Custom Running Plan", url: gutfURL("running/custom-running-plan-free/") });
  }
  if (a.primaryUse === "multisport") {
    out.push({ category: "TRIATHLON", title: "Best Multisport GPS Watches", url: gutfURL("review/best-smartwatches/") });
    out.push({ category: "SWIM", title: "Swim-Proof Watches Reviewed", url: gutfURL("review/best-smartwatches/") });
  }
  if (a.primaryUse === "outdoor") {
    out.push({ category: "ADVENTURE", title: "Best Outdoor & Hiking Watches", url: gutfURL("review/best-smartwatches/") });
  }
  if (a.primaryUse === "gym") {
    out.push({ category: "STRENGTH", title: "Best Watches for Gym & HIIT", url: gutfURL("review/best-smartwatches/") });
  }
  if (a.primaryUse === "everyday" || a.primaryUse === "health") {
    out.push({ category: "HEALTH", title: "ECG & SpO₂ Smartwatches Compared", url: gutfURL("review/best-smartwatches/") });
  }
  if (a.features.includes("ecg") || a.features.includes("spo2")) {
    out.push({ category: "WELLNESS", title: "Best Health-Tracking Watches", url: gutfURL("review/best-fitness-trackers/") });
  }
  out.push({ category: "BUYING GUIDE", title: "Smartwatch Buying Guide 2026", url: gutfURL("review/best-smartwatches/") });
  out.push({ category: "REVIEWS", title: "All Smartwatch Reviews", url: gutfURL("review/") });
  return out.slice(0, 6);
}

const KIT_LINKS = [
  { title: "Best Smartwatches for Runners", url: gutfURL("review/best-smartwatches-for-runners/"), cat: "TECH", color: C.blue, bg: C.blueBg },
  { title: "Best Running Headlamps", url: gutfURL("review/low-light-running-headlamps/"), cat: "SAFETY", color: C.accent, bg: C.accentBg },
  { title: "Best Running Socks", url: gutfURL("review/best-running-socks-for-blister-prevention/"), cat: "APPAREL", color: C.green, bg: C.greenBg },
  { title: "Best Foam Rollers for Recovery", url: gutfURL("best-foam-rollers-for-muscle-recovery/"), cat: "RECOVERY", color: C.purple, bg: C.purpleBg },
  { title: "Best Daily Running Shoes", url: gutfURL("review/best-daily-running-shoes/"), cat: "SHOES", color: C.red, bg: C.redBg },
  { title: "All GearUpToFit Reviews", url: gutfURL("review/"), cat: "EXPLORE", color: C.dark, bg: C.bg },
];

const TIER = (p: number) => (p < 200 ? "BUDGET" : p < 400 ? "MID-RANGE" : p < 700 ? "PREMIUM" : "FLAGSHIP");

// ─── Public types ───
export interface PdfProductInfo {
  url: string;
  image: string | null;
}

export interface WatchPDFData {
  answers: QuizAnswers;
  recommendation: WatchRecommendation;
  setup: WatchSetup;
  top: ScoredWatch[];
  radarData?: { axis: string; value: number }[];
  /** Optional map keyed by `${brand}::${model}`.toLowerCase() with live SerpApi data. */
  products?: Map<string, PdfProductInfo>;
}

function lookupProduct(products: Map<string, PdfProductInfo> | undefined, w: Watch): PdfProductInfo | undefined {
  if (!products) return undefined;
  return products.get(`${w.brand}::${w.model}`.toLowerCase());
}

function buyUrl(p: PdfProductInfo | undefined, w: Watch): string {
  return p?.url || amazonURL(w);
}

function reviewUrl(w: Watch): string {
  return w.reviewPath ? gutfURL(w.reviewPath) : gutfURL("review/best-smartwatches/");
}

const USE_LBL: Record<string, string> = {
  running: "Running", multisport: "Multisport", outdoor: "Outdoor",
  gym: "Gym & Strength", everyday: "Everyday", health: "Health Tracking",
};
const PHONE_LBL: Record<string, string> = { iphone: "iPhone", android: "Android", both: "Any phone" };

function buildRadar(a: QuizAnswers): { axis: string; value: number }[] {
  return [
    { axis: "Battery", value: Math.min(10, Math.round((a.battery / 30) * 10)) },
    { axis: "Sensors", value: Math.min(10, a.features.length + 2) },
    { axis: "Sport", value: a.primaryUse === "multisport" || a.primaryUse === "running" ? 9 : a.primaryUse === "outdoor" ? 8 : 5 },
    { axis: "Smart", value: a.form === "smartwatch" ? 9 : a.form === "hybrid" ? 5 : 6 },
    { axis: "Style", value: a.style === "luxury" ? 9 : a.style === "minimal" ? 7 : 6 },
    { axis: "Health", value: a.features.includes("ecg") || a.features.includes("spo2") ? 9 : 5 },
  ];
}

// ─── Main entry ───
export async function generateWatchReportPDF(data: WatchPDFData) {
  const { answers, recommendation: rec, setup, top, products } = data;
  const radarData = data.radarData || buildRadar(answers);
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  const totalPages = 4;

  // Pre-load logo + product images in parallel.
  const logoP = urlToDataUrl("/images/gearuptofit-logo.png");

  const watchesForImg: Watch[] = [setup.primary.watch];
  if (setup.alt) watchesForImg.push(setup.alt.watch);
  if (setup.budget) watchesForImg.push(setup.budget.watch);
  for (const t of top) if (!watchesForImg.find((w) => w.id === t.watch.id)) watchesForImg.push(t.watch);

  const imgEntries = await Promise.all(
    watchesForImg.slice(0, 8).map(async (w) => {
      const p = lookupProduct(products, w);
      // Try live Amazon CDN image first, then category fallback (always works — local asset).
      let img: LoadedImage | null = null;
      if (p?.image) img = await urlToDataUrl(p.image);
      if (!img) img = await urlToDataUrl(categoryImage(w));
      return [w.id, img] as const;
    }),
  );
  const imgMap = new Map<string, LoadedImage | null>(imgEntries);

  const logoData = (await logoP)?.data ?? null;

  // ════════════════════════════════════════════════════
  // PAGE 1 — Profile + Primary Match
  // ════════════════════════════════════════════════════
  addHeader(doc, logoData);
  let y = 24;

  if (logoData) {
    try { doc.addImage(logoData, "PNG", M, y, 18, 18); } catch { /* ignore */ }
  }

  doc.setFontSize(6);
  doc.setTextColor(C.red[0], C.red[1], C.red[2]);
  doc.setFont("helvetica", "bold");
  doc.text("PERSONALIZED REPORT  ·  WATCHMATCH AI", M + 22, y + 4, { charSpace: 0.6 } as any);

  doc.setFontSize(20);
  doc.setTextColor(C.dark[0], C.dark[1], C.dark[2]);
  doc.setFont("helvetica", "bold");
  doc.text("YOUR SMARTWATCH", M + 22, y + 11);
  doc.setTextColor(C.red[0], C.red[1], C.red[2]);
  doc.text("MATCH REPORT", M + 22, y + 19);

  doc.setFillColor(C.red[0], C.red[1], C.red[2]);
  doc.rect(M + 22, y + 21.5, 32, 0.7, "F");
  y += 26;

  doc.setFontSize(6);
  doc.setTextColor(C.textMuted[0], C.textMuted[1], C.textMuted[2]);
  doc.setFont("helvetica", "normal");
  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  doc.text(`GENERATED ${dateStr.toUpperCase()}   ·   ID ${(answers.primaryUse || "user").toUpperCase()}-${(answers.phone || "any").toUpperCase()}-${(answers.form || "watch").toUpperCase()}`, M, y, { charSpace: 0.4 } as any);
  y += 5;

  // Summary callout
  const sumLines = doc.splitTextToSize(rec.profile.summary, CW - 8);
  const sumH = sumLines.length * 3.6 + 5;
  rr(doc, M, y, CW, sumH, 2, C.bg);
  doc.setFillColor(C.red[0], C.red[1], C.red[2]);
  doc.rect(M, y, 1.5, sumH, "F");
  doc.setFontSize(7.5);
  doc.setTextColor(C.text[0], C.text[1], C.text[2]);
  doc.setFont("helvetica", "italic");
  doc.text(sumLines, M + 5, y + 4);
  y += sumH + 5;

  // Buyer profile card
  rr(doc, M, y, CW, 72, 3, C.cardBg, C.border);
  y = sectionTitle(doc, y + 4, "YOUR BUYER PROFILE");

  const stats = [
    { l: "PROFILE", v: rec.profile.category },
    { l: "FORM FACTOR", v: rec.profile.formFactor },
    { l: "BATTERY TARGET", v: rec.profile.batteryTarget },
    { l: "PHONE", v: PHONE_LBL[answers.phone] || "Any" },
    { l: "PRIMARY USE", v: USE_LBL[answers.primaryUse] || "Everyday" },
    { l: "WRIST SIZE", v: `${answers.wristSize} mm` },
    { l: "STYLE", v: answers.style ? answers.style[0].toUpperCase() + answers.style.slice(1) : "—" },
    { l: "SENSOR PRIORITY", v: rec.profile.sensorPriority },
  ];
  // 2-column stats grid sized to leave room for the radar on the right.
  const colW = 56;
  const cardW = colW - 4;
  stats.forEach((s, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const sx = M + 4 + col * colW;
    const sy = y + row * 13;
    rr(doc, sx, sy, cardW, 12, 2, C.bg);
    labelValue(doc, sx + 3, sy + 3, s.l, s.v, cardW - 6);
  });

  try { drawRadar(doc, M + CW - 36, y + 24, 22, radarData); } catch { /* ignore */ }

  y += 56;

  if (answers.brand.length > 0) {
    doc.setFontSize(5.5);
    doc.setTextColor(C.textMuted[0], C.textMuted[1], C.textMuted[2]);
    doc.setFont("helvetica", "normal");
    doc.text("PREFERRED BRANDS:", M + 4, y);
    let px = M + 34;
    answers.brand.forEach((b) => {
      const tw = pill(doc, px, y - 3.5, b.toUpperCase(), C.blueBg, C.blue);
      px += tw + 2;
    });
    y += 8;
  }

  // #1 Match card
  {
    const w = setup.primary.watch;
    const pct = setup.primary.matchPercent;
    const cardH = 70;
    rr(doc, M, y, CW, cardH, 3, C.cardBg, C.border);
    doc.setFillColor(C.red[0], C.red[1], C.red[2]);
    doc.rect(M, y, 3, cardH, "F");

    const imgW = 54;
    const imgH = cardH - 12;
    const imgX = PW - M - imgW - 4;
    const imgY = y + 6;
    const leftRight = imgX - 4;

    drawWatchFrame(doc, imgX, imgY, imgW, imgH, imgMap.get(w.id) ?? null, w.brand, w.model);

    // #1 badge
    rr(doc, M + 6, y + 4, 14, 14, 7, C.red);
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("#1", M + 13, y + 13, { align: "center" });

    // Match badge
    rr(doc, imgX + imgW - 20, imgY + 1.5, 18, 9, 2, C.greenBg);
    doc.setFontSize(9);
    doc.setTextColor(C.green[0], C.green[1], C.green[2]);
    doc.setFont("helvetica", "bold");
    doc.text(`${pct}%`, imgX + imgW - 11, imgY + 8, { align: "center" });

    doc.setFontSize(5);
    doc.setTextColor(C.textMuted[0], C.textMuted[1], C.textMuted[2]);
    doc.setFont("helvetica", "normal");
    doc.text("YOUR BEST MATCH", M + 23, y + 9);

    doc.setFontSize(13);
    doc.setTextColor(C.dark[0], C.dark[1], C.dark[2]);
    doc.setFont("helvetica", "bold");
    const nameLines = doc.splitTextToSize(asciiSafe(`${w.brand} ${w.model}`), leftRight - (M + 23));
    doc.text(nameLines.slice(0, 2), M + 23, y + 16);

    doc.setFontSize(10);
    doc.setTextColor(C.red[0], C.red[1], C.red[2]);
    doc.setFont("helvetica", "bold");
    doc.text(TIER(w.priceUSD), M + 23, y + 24);

    doc.setFontSize(6);
    doc.setTextColor(C.textMuted[0], C.textMuted[1], C.textMuted[2]);
    doc.setFont("helvetica", "normal");
    const meta = `${w.weightGrams}G   ·   ${w.caseSizeMM}MM   ·   ${w.batteryDays}D BAT   ·   ${w.display}`;
    doc.text(meta, M + 23, y + 28.5, { charSpace: 0.4 } as any);

    // Highlight + Reasons
    doc.setFontSize(6.5);
    doc.setTextColor(C.text[0], C.text[1], C.text[2]);
    doc.setFont("helvetica", "italic");
    const hlMax = leftRight - (M + 14) - 2;
    const hLines = doc.splitTextToSize(w.highlight, hlMax + 6);
    doc.text(hLines.slice(0, 2), M + 8, y + 35);

    const reasonsY = y + 35 + Math.min(hLines.length, 2) * 4 + 2;
    doc.setFontSize(5);
    doc.setTextColor(C.red[0], C.red[1], C.red[2]);
    doc.setFont("helvetica", "bold");
    doc.text("WHY IT MATCHES YOU", M + 8, reasonsY);
    let rcur = reasonsY + 4;
    setup.primary.reasons.slice(0, 2).forEach((r) => {
      doc.setFillColor(C.red[0], C.red[1], C.red[2]);
      doc.circle(M + 10, rcur, 0.9, "F");
      doc.setFontSize(6);
      doc.setTextColor(C.text[0], C.text[1], C.text[2]);
      doc.setFont("helvetica", "normal");
      const rLines = (doc.splitTextToSize(r, hlMax) as string[]).slice(0, 2);
      doc.text(rLines, M + 14, rcur + 1);
      rcur += rLines.length * 3.4 + 1.6;
    });

    // Amazon CTA below image
    const btnW = 40;
    const btnX = imgX + (imgW - btnW) / 2;
    const btnY = y + cardH - 7.5;
    rr(doc, btnX, btnY, btnW, 6.5, 2, C.red);
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("BUY ON AMAZON", btnX + btnW / 2, btnY + 4.4, { align: "center" });
    doc.link(btnX, btnY, btnW, 6.5, { url: buyUrl(lookupProduct(products, w), w) });

    link(doc, M + 8, y + cardH - 3, "Read Full Review on GearUpToFit", reviewUrl(w), 5.5);

    y += cardH + 6;
  }

  // Why this match works
  if (y + 35 < PH - 22) {
    rr(doc, M, y, CW, 32, 3, C.accentBg, C.border);
    y = sectionTitle(doc, y + 3, "WHY THIS MATCH WORKS", C.accent);
    doc.setFontSize(6.5);
    doc.setTextColor(C.text[0], C.text[1], C.text[2]);
    doc.setFont("helvetica", "normal");
    const whyLines = doc.splitTextToSize(rec.why, CW - 14);
    doc.text(whyLines.slice(0, 7), M + 7, y);
    y += whyLines.length * 3.2 + 4;
    link(doc, M + 7, y, "Smartwatch Buying Guide — gearuptofit.com", gutfURL("review/best-smartwatches/"), 5.5);
  }

  addFooter(doc, 1, totalPages);

  // ════════════════════════════════════════════════════
  // PAGE 2 — Your Watch Setup (Primary / Alt / Budget)
  // ════════════════════════════════════════════════════
  doc.addPage();
  addHeader(doc, logoData);
  y = 30;

  doc.setFontSize(18);
  doc.setTextColor(C.dark[0], C.dark[1], C.dark[2]);
  doc.setFont("helvetica", "bold");
  doc.text("YOUR COMPLETE WATCH SETUP", M, y);
  doc.setFillColor(C.red[0], C.red[1], C.red[2]);
  doc.rect(M, y + 2, 28, 0.7, "F");
  y += 7;

  doc.setFontSize(7);
  doc.setTextColor(C.textMuted[0], C.textMuted[1], C.textMuted[2]);
  doc.setFont("helvetica", "italic");
  doc.text("Three hand-picked options: your best match, a smart alternative, and a budget pick.", M, y);
  y += 5;

  rr(doc, M, y, CW, 9, 2, C.greenBg);
  doc.setFontSize(6.5);
  doc.setTextColor(C.green[0], C.green[1], C.green[2]);
  doc.setFont("helvetica", "bold");
  doc.text(`Scored against ${watchDatabase.length} verified watches in the GearUpToFit database.`, M + 4, y + 6);
  y += 13;

  type Slot = { role: string; color: RGB; bg: RGB; s: ScoredWatch; desc: string };
  const slots: Slot[] = [
    { role: "BEST MATCH", color: C.red, bg: C.redBg, s: setup.primary, desc: "Your top recommendation overall" },
  ];
  if (setup.alt) slots.push({ role: "SMART ALTERNATIVE", color: C.blue, bg: C.blueBg, s: setup.alt, desc: "Different brand or ecosystem, same fit" });
  if (setup.budget) slots.push({ role: "BUDGET PICK", color: C.purple, bg: C.purpleBg, s: setup.budget, desc: "Excellent value at a lower price" });

  const cardH = 58;
  slots.forEach((item, i) => {
    const cy = y + i * (cardH + 6);
    rr(doc, M, cy, CW, cardH, 3, C.cardBg, C.border);
    doc.setFillColor(item.color[0], item.color[1], item.color[2]);
    doc.rect(M, cy, 3, cardH, "F");

    const imgW = 46;
    const imgH = cardH - 8;
    const imgX = PW - M - imgW - 4;
    const imgY = cy + 4;
    const textRight = imgX - 6;

    drawWatchFrame(doc, imgX, imgY, imgW, imgH, imgMap.get(item.s.watch.id) ?? null, item.s.watch.brand, item.s.watch.model);

    pill(doc, M + 8, cy + 5, item.role, item.bg, item.color);
    const pctText = `${item.s.matchPercent}% MATCH`;
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    const pctW = doc.getTextWidth(pctText) + 6;
    rr(doc, M + 8 + 36, cy + 5, pctW, 6, 3, C.greenBg);
    doc.setTextColor(C.green[0], C.green[1], C.green[2]);
    doc.text(pctText, M + 8 + 36 + pctW / 2, cy + 9.2, { align: "center" });

    doc.setFontSize(13);
    doc.setTextColor(C.dark[0], C.dark[1], C.dark[2]);
    doc.setFont("helvetica", "bold");
    const nameLines = doc.splitTextToSize(asciiSafe(`${item.s.watch.brand} ${item.s.watch.model}`), textRight - (M + 8));
    doc.text(nameLines.slice(0, 2), M + 8, cy + 18);

    doc.setFontSize(9);
    doc.setTextColor(C.red[0], C.red[1], C.red[2]);
    doc.setFont("helvetica", "bold");
    doc.text(TIER(item.s.watch.priceUSD), M + 8, cy + 28);

    doc.setFontSize(5.8);
    doc.setTextColor(C.textMuted[0], C.textMuted[1], C.textMuted[2]);
    doc.setFont("helvetica", "normal");
    doc.text(`${item.s.watch.weightGrams}G   ·   ${item.s.watch.caseSizeMM}MM   ·   ${item.s.watch.batteryDays}D BAT`, M + 24, cy + 28, { charSpace: 0.4 } as any);

    doc.setFontSize(6.2);
    doc.setTextColor(C.text[0], C.text[1], C.text[2]);
    doc.setFont("helvetica", "italic");
    const descLines = doc.splitTextToSize(item.desc, textRight - (M + 8));
    doc.text(descLines[0], M + 8, cy + 33);

    let hcur = cy + 39;
    item.s.reasons.slice(0, 2).forEach((h) => {
      doc.setFillColor(item.color[0], item.color[1], item.color[2]);
      doc.circle(M + 10, hcur, 0.8, "F");
      doc.setFontSize(6);
      doc.setTextColor(C.text[0], C.text[1], C.text[2]);
      doc.setFont("helvetica", "normal");
      const hLines = (doc.splitTextToSize(h, textRight - (M + 14)) as string[]).slice(0, 2);
      doc.text(hLines, M + 14, hcur + 1);
      hcur += hLines.length * 3.2 + 1.4;
    });

    const btnW = imgW;
    const btnX = imgX;
    const btnY = cy + cardH - 6.5;
    rr(doc, btnX, btnY, btnW, 5.5, 1.8, C.red);
    doc.setFontSize(6);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("BUY ON AMAZON  ›", btnX + btnW / 2, btnY + 3.7, { align: "center", charSpace: 0.4 } as any);
    doc.link(btnX, btnY, btnW, 5.5, { url: buyUrl(lookupProduct(products, item.s.watch), item.s.watch) });

    link(doc, M + 8, cy + cardH - 3, "Read Full Review on GearUpToFit ›", reviewUrl(item.s.watch), 5.5);
  });

  y += slots.length * (cardH + 6) + 6;

  if (y + 40 < PH - 22) {
    y = sectionTitle(doc, y, "TRAINING & USAGE EMPHASIS");
    rec.emphasis.forEach((tip, i) => {
      if (y > PH - 28) return;
      const tl = (doc.splitTextToSize(tip, CW - 22) as string[]).slice(0, 2);
      const blockH = Math.max(9, tl.length * 3.6 + 4);
      rr(doc, M + 3, y - 2, CW - 6, blockH, 2, i % 2 === 0 ? C.bg : C.cardBg);
      rr(doc, M + 5, y - 1, 6, 6, 3, C.red);
      doc.setFontSize(5.5);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text(String(i + 1), M + 8, y + 3, { align: "center" });
      doc.setFontSize(6.5);
      doc.setTextColor(C.text[0], C.text[1], C.text[2]);
      doc.setFont("helvetica", "normal");
      doc.text(tl, M + 14, y + 3);
      y += blockH + 1;
    });
    link(doc, M, y, "Free Custom Running Plan on GearUpToFit", gutfURL("running/custom-running-plan-free/"), 6);
  }

  addFooter(doc, 2, totalPages);

  // ════════════════════════════════════════════════════
  // PAGE 3 — Top Matches Ranked + Resources
  // ════════════════════════════════════════════════════
  doc.addPage();
  addHeader(doc, logoData);
  y = 30;

  doc.setFontSize(18);
  doc.setTextColor(C.dark[0], C.dark[1], C.dark[2]);
  doc.setFont("helvetica", "bold");
  doc.text("TOP MATCHES RANKED", M, y);
  doc.setFillColor(C.red[0], C.red[1], C.red[2]);
  doc.rect(M, y + 2, 28, 0.7, "F");
  y += 7;

  doc.setFontSize(7);
  doc.setTextColor(C.textMuted[0], C.textMuted[1], C.textMuted[2]);
  doc.setFont("helvetica", "italic");
  doc.text("The five strongest watches in our database for your exact profile.", M, y);
  y += 8;

  const rowH = 22;
  const list = top.slice(0, 5);
  list.forEach((s, i) => {
    const ry = y + i * (rowH + 3);
    rr(doc, M, ry, CW, rowH, 2, i === 0 ? C.redBg : C.bg, C.border);

    // Rank number
    doc.setFontSize(11);
    doc.setTextColor(i === 0 ? C.red[0] : C.textMuted[0], i === 0 ? C.red[1] : C.textMuted[1], i === 0 ? C.red[2] : C.textMuted[2]);
    doc.setFont("helvetica", "bold");
    doc.text(`#${i + 1}`, M + 5, ry + 13);

    // Mini image
    const imgW = 22, imgH = rowH - 4;
    const ix = M + 13, iy = ry + 2;
    drawWatchFrame(doc, ix, iy, imgW, imgH, imgMap.get(s.watch.id) ?? null, s.watch.brand, s.watch.model);

    const tx = ix + imgW + 4;
    doc.setFontSize(5);
    doc.setTextColor(C.textMuted[0], C.textMuted[1], C.textMuted[2]);
    doc.setFont("helvetica", "bold");
    doc.text(asciiSafe(s.watch.brand.toUpperCase()), tx, ry + 5, { charSpace: 0.4 } as any);

    doc.setFontSize(9);
    doc.setTextColor(C.dark[0], C.dark[1], C.dark[2]);
    doc.setFont("helvetica", "bold");
    const name = doc.splitTextToSize(asciiSafe(s.watch.model), 70);
    doc.text(name[0], tx, ry + 10);

    doc.setFontSize(5.5);
    doc.setTextColor(C.textMuted[0], C.textMuted[1], C.textMuted[2]);
    doc.setFont("helvetica", "normal");
    doc.text(`${s.watch.weightGrams}G · ${s.watch.caseSizeMM}MM · ${s.watch.batteryDays}D · ${s.watch.display}`, tx, ry + 14, { charSpace: 0.3 } as any);

    // Tier
    doc.setFontSize(6.5);
    doc.setTextColor(C.red[0], C.red[1], C.red[2]);
    doc.setFont("helvetica", "bold");
    doc.text(TIER(s.watch.priceUSD), tx, ry + 19);

    // Match %
    doc.setFontSize(11);
    doc.setTextColor(C.green[0], C.green[1], C.green[2]);
    doc.setFont("helvetica", "bold");
    doc.text(`${s.matchPercent}%`, M + CW - 22, ry + 11, { align: "right" });
    doc.setFontSize(5);
    doc.setTextColor(C.textMuted[0], C.textMuted[1], C.textMuted[2]);
    doc.setFont("helvetica", "normal");
    doc.text("MATCH", M + CW - 22, ry + 15, { align: "right" });

    // Buy button
    const btnW = 18;
    rr(doc, M + CW - btnW - 2, ry + (rowH - 6) / 2, btnW, 6, 1.5, C.red);
    doc.setFontSize(5.5);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("BUY ›", M + CW - btnW / 2 - 2, ry + (rowH - 6) / 2 + 4, { align: "center" });
    doc.link(M + CW - btnW - 2, ry + (rowH - 6) / 2, btnW, 6, { url: buyUrl(lookupProduct(products, s.watch), s.watch) });
  });

  y += list.length * (rowH + 3) + 4;

  // Read before you buy
  if (y + 30 < PH - 22) {
    const mrH = 6 + Math.ceil(READ_BEFORE_BUY.length / 2) * 6 + 4;
    rr(doc, M, y, CW, mrH, 3, C.accentBg, C.border);
    y = sectionTitle(doc, y + 3, "READ BEFORE YOU BUY", C.accent);
    READ_BEFORE_BUY.forEach((item, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cx = M + 7 + col * (CW / 2);
      const cy = y + row * 6;
      doc.setFillColor(C.accent[0], C.accent[1], C.accent[2]);
      doc.circle(cx, cy, 0.9, "F");
      link(doc, cx + 3, cy + 1.4, item.title, item.url, 6.5);
    });
    y += Math.ceil(READ_BEFORE_BUY.length / 2) * 6 + 6;
  }

  // Personalized articles
  if (y + 30 < PH - 22) {
    y = sectionTitle(doc, y, "PERSONALIZED ARTICLES FOR YOU");
    const articles = articlesFor(answers);
    const artColW = CW / 2 - 2;
    const artH = 13;
    articles.slice(0, 6).forEach((article, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const ax = M + col * (artColW + 4);
      const ay = y + row * (artH + 3);
      if (ay + artH > PH - 22) return;
      rr(doc, ax, ay, artColW, artH, 2, C.bg, C.border);
      doc.setFontSize(5);
      doc.setTextColor(C.red[0], C.red[1], C.red[2]);
      doc.setFont("helvetica", "bold");
      doc.text(article.category.toUpperCase(), ax + 4, ay + 4, { charSpace: 0.5 } as any);
      doc.setFontSize(7);
      doc.setTextColor(C.dark[0], C.dark[1], C.dark[2]);
      doc.setFont("helvetica", "bold");
      const tLines = doc.splitTextToSize(article.title, artColW - 8);
      doc.text(tLines.slice(0, 2), ax + 4, ay + 8.5);
      doc.link(ax, ay, artColW, artH, { url: article.url });
      doc.setFontSize(7);
      doc.setTextColor(C.red[0], C.red[1], C.red[2]);
      doc.text("›", ax + artColW - 4, ay + 8.5, { align: "right" });
    });
  }

  addFooter(doc, 3, totalPages);

  // ════════════════════════════════════════════════════
  // PAGE 4 — Complete Your Kit + CTA
  // ════════════════════════════════════════════════════
  doc.addPage();
  addHeader(doc, logoData);
  y = 30;

  doc.setFontSize(18);
  doc.setTextColor(C.dark[0], C.dark[1], C.dark[2]);
  doc.setFont("helvetica", "bold");
  doc.text("COMPLETE YOUR FITNESS KIT", M, y);
  doc.setFillColor(C.red[0], C.red[1], C.red[2]);
  doc.rect(M, y + 2, 28, 0.7, "F");
  y += 7;

  doc.setFontSize(7);
  doc.setTextColor(C.textMuted[0], C.textMuted[1], C.textMuted[2]);
  doc.setFont("helvetica", "italic");
  doc.text("Hand-picked guides and reviews from GearUpToFit to round out your training setup.", M, y);
  y += 8;

  const kitColW = CW / 2 - 2;
  const kitH = 18;
  KIT_LINKS.forEach((kit, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const kx = M + col * (kitColW + 4);
    const ky = y + row * (kitH + 4);
    rr(doc, kx, ky, kitColW, kitH, 2, kit.bg as RGB, C.border);

    doc.setFontSize(5);
    doc.setTextColor((kit.color as RGB)[0], (kit.color as RGB)[1], (kit.color as RGB)[2]);
    doc.setFont("helvetica", "bold");
    doc.text(kit.cat, kx + 4, ky + 5, { charSpace: 0.5 } as any);

    doc.setFontSize(8);
    doc.setTextColor(C.dark[0], C.dark[1], C.dark[2]);
    doc.setFont("helvetica", "bold");
    const tl = doc.splitTextToSize(kit.title, kitColW - 8);
    doc.text(tl.slice(0, 2), kx + 4, ky + 11);
    doc.link(kx, ky, kitColW, kitH, { url: kit.url });

    doc.setFontSize(7);
    doc.setTextColor((kit.color as RGB)[0], (kit.color as RGB)[1], (kit.color as RGB)[2]);
    doc.text("READ ›", kx + kitColW - 4, ky + kitH - 3, { align: "right" });
  });
  y += Math.ceil(KIT_LINKS.length / 2) * (kitH + 4) + 6;

  // Methodology
  if (y + 36 < PH - 22) {
    y = sectionTitle(doc, y, "METHODOLOGY", C.blue);
    doc.setFontSize(7);
    doc.setTextColor(C.text[0], C.text[1], C.text[2]);
    doc.setFont("helvetica", "normal");
    const meth = `WatchMatch AI scores every watch in our verified database across nine weighted dimensions: primary use, phone ecosystem, form factor, battery life, sensor coverage, wrist sizing, style, brand affinity, and budget. Exact-match bonuses reward perfect ecosystem and feature alignment. We then de-duplicate by brand to surface a strong cross-section. Every Amazon link uses the papalex-20 affiliate tag — it never changes your price and keeps our research free.`;
    const ml = doc.splitTextToSize(meth, CW - 6);
    doc.text(ml, M + 3, y);
    y += ml.length * 3.4 + 6;
  }

  // Closing CTA
  if (y + 30 < PH - 22) {
    rr(doc, M, y, CW, 28, 3, C.dark);
    doc.setFontSize(8);
    doc.setTextColor(C.red[0], C.red[1], C.red[2]);
    doc.setFont("helvetica", "bold");
    doc.text("READY TO BUY?", M + 6, y + 8);
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(`Open ${setup.primary.watch.brand} ${setup.primary.watch.model} on Amazon`, M + 6, y + 16);
    doc.setFontSize(7);
    doc.setTextColor(200, 205, 215);
    doc.setFont("helvetica", "normal");
    doc.text("Live price and stock verified at the time of report download.", M + 6, y + 22);
    const cBtnW = 36;
    rr(doc, M + CW - cBtnW - 4, y + 11, cBtnW, 8, 2, C.red);
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("BUY NOW ›", M + CW - cBtnW / 2 - 4, y + 16, { align: "center" });
    doc.link(M + CW - cBtnW - 4, y + 11, cBtnW, 8, { url: buyUrl(lookupProduct(products, setup.primary.watch), setup.primary.watch) });
  }

  addFooter(doc, 4, totalPages);

  const slug = `${setup.primary.watch.brand}-${setup.primary.watch.model}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  doc.save(`GearUpToFit-WatchMatch-${slug}.pdf`);
}