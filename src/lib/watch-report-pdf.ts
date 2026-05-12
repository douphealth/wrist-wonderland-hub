import jsPDF from "jspdf";
import type { QuizAnswers } from "./quiz-data";
import type { WatchRecommendation } from "./recommendation-engine";
import type { ScoredWatch, WatchSetup } from "./scoring-engine";
import { WATCH_DB_LAST_UPDATED, watchDatabase } from "./watch-database";

type RGB = readonly [number, number, number];

// Premium palette
const ink: RGB = [13, 17, 28];
const sub: RGB = [82, 92, 110];
const muted: RGB = [140, 150, 168];
const line: RGB = [225, 230, 238];
const panel: RGB = [247, 249, 252];
const accent: RGB = [224, 35, 46]; // gearuptofit red
const accentDark: RGB = [160, 18, 28];
const gold: RGB = [201, 162, 39];
const ok: RGB = [22, 130, 90];
const ivory: RGB = [252, 250, 246];

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 16;

function setFill(doc: jsPDF, c: RGB) { doc.setFillColor(c[0], c[1], c[2]); }
function setStroke(doc: jsPDF, c: RGB) { doc.setDrawColor(c[0], c[1], c[2]); }
function setText(doc: jsPDF, c: RGB) { doc.setTextColor(c[0], c[1], c[2]); }

function text(doc: jsPDF, value: string, x: number, y: number, opts: { size?: number; color?: RGB; style?: "normal" | "bold"; align?: "left" | "center" | "right" } = {}) {
  const { size = 10, color = ink, style = "normal", align = "left" } = opts;
  doc.setFont("helvetica", style);
  doc.setFontSize(size);
  setText(doc, color);
  doc.text(value, x, y, { align });
}

function wrap(doc: jsPDF, value: string, x: number, y: number, width: number, opts: { size?: number; color?: RGB; lineHeight?: number; style?: "normal" | "bold" } = {}) {
  const { size = 9.5, color = sub, lineHeight = 1.45, style = "normal" } = opts;
  doc.setFont("helvetica", style);
  doc.setFontSize(size);
  setText(doc, color);
  const lines = doc.splitTextToSize(value, width);
  doc.text(lines, x, y);
  return y + lines.length * size * 0.353 * lineHeight;
}

function gradientBar(doc: jsPDF, x: number, y: number, w: number, h: number, from: RGB, to: RGB, steps = 60) {
  const sw = w / steps;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const r = Math.round(from[0] + (to[0] - from[0]) * t);
    const g = Math.round(from[1] + (to[1] - from[1]) * t);
    const b = Math.round(from[2] + (to[2] - from[2]) * t);
    doc.setFillColor(r, g, b);
    doc.rect(x + i * sw, y, sw + 0.4, h, "F");
  }
}

function pill(doc: jsPDF, label: string, x: number, y: number, opts: { bg?: RGB; fg?: RGB; size?: number } = {}) {
  const { bg = panel, fg = sub, size = 7.5 } = opts;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(size);
  const w = doc.getTextWidth(label) + 6;
  const h = size * 0.55 + 2.4;
  setFill(doc, bg);
  doc.roundedRect(x, y - h + 1.4, w, h, h / 2, h / 2, "F");
  setText(doc, fg);
  doc.text(label, x + 3, y - 0.6);
  return x + w + 2.4;
}

function scoreBar(doc: jsPDF, x: number, y: number, w: number, percent: number, color: RGB = accent) {
  setFill(doc, [240, 242, 246]);
  doc.roundedRect(x, y, w, 3.4, 1.7, 1.7, "F");
  const fillW = Math.max(2, (percent / 100) * w);
  gradientBar(doc, x, y, fillW, 3.4, color, [Math.min(255, color[0] + 40), Math.min(255, color[1] + 30), Math.min(255, color[2] + 30)] as RGB, 30);
}

function header(doc: jsPDF, page: number, total: number) {
  setFill(doc, ivory);
  doc.rect(0, 0, PAGE_W, 12, "F");
  text(doc, "GEARUPTOFIT · WATCHMATCH AI", MARGIN, 7.8, { size: 7.5, color: accent, style: "bold" });
  text(doc, `Page ${page} / ${total}`, PAGE_W - MARGIN, 7.8, { size: 7.5, color: muted, align: "right" });
  setStroke(doc, line);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, 12, PAGE_W - MARGIN, 12);
}

function footer(doc: jsPDF) {
  setStroke(doc, line);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, PAGE_H - 14, PAGE_W - MARGIN, PAGE_H - 14);
  text(doc, `gearuptofit.com  ·  Database verified ${WATCH_DB_LAST_UPDATED}  ·  ${watchDatabase.length} watches analyzed`, MARGIN, PAGE_H - 8, { size: 7, color: muted });
  text(doc, "Personalized · Independent · Affiliate-honest", PAGE_W - MARGIN, PAGE_H - 8, { size: 7, color: muted, align: "right" });
}

function newPage(doc: jsPDF, pageNum: { n: number; total: number }) {
  doc.addPage();
  pageNum.n += 1;
  header(doc, pageNum.n, pageNum.total);
  footer(doc);
}

const USE_LBL: Record<string, string> = {
  running: "Running", multisport: "Multisport", outdoor: "Outdoor",
  gym: "Gym & Strength", everyday: "Everyday", health: "Health Tracking",
};
const PHONE_LBL: Record<string, string> = { iphone: "iPhone", android: "Android", both: "Any phone" };
const FEATURE_LBL: Record<string, string> = {
  gps: "GPS", ecg: "ECG", spo2: "SpO₂", music: "Music storage",
  lte: "LTE / Cellular", payments: "Contactless pay", amoled: "AMOLED",
  maps: "Offline maps", swim: "Swim-proof",
};

export function generateWatchReportPDF(data: {
  answers: QuizAnswers;
  recommendation: WatchRecommendation;
  setup: WatchSetup;
  top: ScoredWatch[];
}) {
  const { answers, recommendation, setup, top } = data;
  const primary = setup.primary;
  const w = primary.watch;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  const totalPages = 4;
  const page = { n: 1, total: totalPages };

  // ====================================================================
  // PAGE 1 — COVER
  // ====================================================================
  // Cinematic dark hero
  setFill(doc, [10, 14, 22]);
  doc.rect(0, 0, PAGE_W, 165, "F");
  // Glow accent
  gradientBar(doc, 0, 0, PAGE_W, 165, [10, 14, 22], [22, 30, 48], 80);
  // Red corner ribbon
  setFill(doc, accent);
  doc.rect(0, 0, 5, 165, "F");

  // Brand mark
  text(doc, "GEARUPTOFIT", MARGIN, 22, { size: 9, color: [255, 255, 255], style: "bold" });
  text(doc, "WATCHMATCH AI · INTELLIGENCE REPORT", MARGIN, 28, { size: 7.5, color: [180, 192, 215] });

  // Title
  text(doc, "Your Personal", MARGIN, 56, { size: 28, color: [255, 255, 255], style: "bold" });
  text(doc, "Smartwatch Match", MARGIN, 70, { size: 28, color: [255, 255, 255], style: "bold" });
  setFill(doc, accent);
  doc.rect(MARGIN, 76, 24, 1.2, "F");

  // Match score circle (drawn)
  const cx = PAGE_W - MARGIN - 26;
  const cy = 50;
  // outer ring glow
  setFill(doc, [25, 32, 50]);
  doc.circle(cx, cy, 24, "F");
  setFill(doc, [255, 255, 255]);
  doc.circle(cx, cy, 21, "F");
  // arc-like fill — simulate with overlay
  setFill(doc, accent);
  doc.circle(cx, cy, 21, "S");
  setStroke(doc, accent);
  doc.setLineWidth(2.2);
  doc.circle(cx, cy, 21, "S");
  doc.setLineWidth(0.2);
  text(doc, `${primary.matchPercent}`, cx, cy + 1, { size: 28, color: ink, style: "bold", align: "center" });
  text(doc, "% MATCH", cx, cy + 9, { size: 7, color: accent, style: "bold", align: "center" });

  // Recipient block
  text(doc, "PREPARED FOR", MARGIN, 96, { size: 7, color: [180, 192, 215], style: "bold" });
  text(doc, `${USE_LBL[answers.primaryUse] || "Smartwatch buyer"} on ${PHONE_LBL[answers.phone] || "any phone"}`, MARGIN, 106, { size: 14, color: [255, 255, 255], style: "bold" });
  text(doc, `Style: ${answers.style || "—"}  ·  Form: ${answers.form || "—"}  ·  Battery target: ${answers.battery}+ days`, MARGIN, 113, { size: 9, color: [180, 192, 215] });

  // Decorative divider
  setStroke(doc, [40, 50, 72]);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, 130, PAGE_W - MARGIN, 130);

  text(doc, "TOP RECOMMENDATION", MARGIN, 142, { size: 7, color: [180, 192, 215], style: "bold" });
  text(doc, `${w.brand}`, MARGIN, 153, { size: 13, color: [255, 255, 255] });
  text(doc, `${w.model}`, MARGIN, 161, { size: 18, color: [255, 255, 255], style: "bold" });

  // ===== body =====
  // Hero highlight card
  let y = 180;
  setFill(doc, ivory);
  doc.roundedRect(MARGIN, y, PAGE_W - MARGIN * 2, 50, 4, 4, "F");
  setStroke(doc, line);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, y, PAGE_W - MARGIN * 2, 50, 4, 4, "S");

  text(doc, "EDITOR'S TAKE", MARGIN + 6, y + 10, { size: 7, color: accent, style: "bold" });
  wrap(doc, w.highlight, MARGIN + 6, y + 18, PAGE_W - MARGIN * 2 - 12, { size: 10.5, color: ink, lineHeight: 1.45 });
  text(doc, `$${w.priceUSD}`, MARGIN + 6, y + 44, { size: 16, color: accent, style: "bold" });
  text(doc, "USD MSRP", MARGIN + 28, y + 44, { size: 8, color: muted });

  // Spec strip
  y = 240;
  const specs: Array<[string, string]> = [
    ["BATTERY", `${w.batteryDays} d`],
    ["DISPLAY", w.display],
    ["CASE", `${w.caseSizeMM} mm`],
    ["WEIGHT", `${w.weightGrams} g`],
    ["WATER", w.waterRating],
    ["YEAR", `${w.year}`],
  ];
  const colW = (PAGE_W - MARGIN * 2) / specs.length;
  setFill(doc, [12, 18, 30]);
  doc.roundedRect(MARGIN, y, PAGE_W - MARGIN * 2, 26, 3, 3, "F");
  specs.forEach(([k, v], i) => {
    const cxs = MARGIN + colW * i + colW / 2;
    text(doc, k, cxs, y + 9, { size: 6.5, color: [170, 182, 205], style: "bold", align: "center" });
    text(doc, v, cxs, y + 19, { size: 12, color: [255, 255, 255], style: "bold", align: "center" });
  });

  footer(doc);

  // ====================================================================
  // PAGE 2 — WHY THIS WATCH + SCORE BREAKDOWN
  // ====================================================================
  newPage(doc, page);
  y = 24;
  text(doc, "Why This Watch", MARGIN, y, { size: 22, color: ink, style: "bold" });
  setFill(doc, accent);
  doc.rect(MARGIN, y + 3, 18, 1, "F");

  y += 14;
  text(doc, recommendation.profile.category.toUpperCase(), MARGIN, y, { size: 8, color: accent, style: "bold" });
  y += 6;
  y = wrap(doc, recommendation.profile.summary, MARGIN, y, PAGE_W - MARGIN * 2, { size: 11, color: ink, lineHeight: 1.5 });
  y += 4;
  y = wrap(doc, recommendation.why, MARGIN, y, PAGE_W - MARGIN * 2, { size: 9.5, color: sub, lineHeight: 1.55 });

  // Reasons pills
  y += 6;
  if (primary.reasons.length) {
    text(doc, "MATCH SIGNALS", MARGIN, y, { size: 7.5, color: accent, style: "bold" });
    y += 6;
    let px = MARGIN;
    primary.reasons.forEach((r) => {
      const next = pill(doc, r, px, y + 3, { bg: [253, 232, 234], fg: accentDark, size: 7.5 });
      if (next > PAGE_W - MARGIN) {
        y += 8;
        px = pill(doc, r, MARGIN, y + 3, { bg: [253, 232, 234], fg: accentDark, size: 7.5 });
      } else {
        px = next;
      }
    });
    y += 10;
  }

  // Score breakdown
  y += 6;
  text(doc, "Compatibility Breakdown", MARGIN, y, { size: 14, color: ink, style: "bold" });
  y += 8;
  const dims: Array<[string, number]> = [
    ["Use case fit", Math.min(100, Math.round((primary.score) * 110))],
    ["Phone ecosystem", answers.phone === "both" || w.phones.includes(answers.phone as any) ? 98 : 70],
    ["Form factor", w.category === answers.form ? 100 : 55],
    ["Battery life", Math.min(100, Math.round((w.batteryDays / Math.max(answers.battery, 1)) * 90))],
    ["Sensors & features", answers.features.length ? Math.round(answers.features.filter((f) => w.features.includes(f)).length / answers.features.length * 100) : 88],
    ["Style alignment", w.style.includes(answers.style as any) ? 96 : 60],
    ["Budget fit", primary.matchPercent],
  ];
  dims.forEach(([label, val]) => {
    text(doc, label, MARGIN, y, { size: 9, color: ink, style: "bold" });
    text(doc, `${val}%`, PAGE_W - MARGIN, y, { size: 9, color: accent, style: "bold", align: "right" });
    scoreBar(doc, MARGIN, y + 2, PAGE_W - MARGIN * 2, val);
    y += 10;
  });

  // Action plan
  y += 6;
  text(doc, "Your Action Plan", MARGIN, y, { size: 14, color: ink, style: "bold" });
  y += 8;
  recommendation.emphasis.forEach((tip, i) => {
    setFill(doc, accent);
    doc.circle(MARGIN + 2, y - 1.5, 1.4, "F");
    text(doc, `${i + 1}`, MARGIN + 2, y - 0.4, { size: 6, color: [255, 255, 255], style: "bold", align: "center" });
    y = wrap(doc, tip, MARGIN + 8, y, PAGE_W - MARGIN * 2 - 8, { size: 9.5, color: sub, lineHeight: 1.5 });
    y += 4;
  });

  // ====================================================================
  // PAGE 3 — TOP MATCHES TABLE
  // ====================================================================
  newPage(doc, page);
  y = 24;
  text(doc, "Top Matches Ranked", MARGIN, y, { size: 22, color: ink, style: "bold" });
  setFill(doc, accent);
  doc.rect(MARGIN, y + 3, 18, 1, "F");
  y += 12;
  text(doc, `Scored against ${watchDatabase.length} verified watches in the GearUpToFit database.`, MARGIN, y, { size: 9, color: muted });
  y += 10;

  // Table header
  setFill(doc, [12, 18, 30]);
  doc.roundedRect(MARGIN, y, PAGE_W - MARGIN * 2, 9, 1.5, 1.5, "F");
  const cols = [
    { x: MARGIN + 4, label: "#" },
    { x: MARGIN + 12, label: "WATCH" },
    { x: MARGIN + 92, label: "PRICE" },
    { x: MARGIN + 112, label: "BATTERY" },
    { x: MARGIN + 138, label: "DISPLAY" },
    { x: PAGE_W - MARGIN - 4, label: "MATCH", align: "right" as const },
  ];
  cols.forEach((c) => text(doc, c.label, c.x, y + 6, { size: 7, color: [220, 228, 240], style: "bold", align: c.align }));
  y += 12;

  top.slice(0, 8).forEach((s, i) => {
    const row = s.watch;
    if (i % 2 === 0) {
      setFill(doc, panel);
      doc.roundedRect(MARGIN, y - 5, PAGE_W - MARGIN * 2, 13, 1, 1, "F");
    }
    text(doc, `${i + 1}`, cols[0].x, y + 2, { size: 9, color: i === 0 ? accent : muted, style: "bold" });
    text(doc, row.brand, cols[1].x, y - 0.5, { size: 7.5, color: muted, style: "bold" });
    text(doc, row.model, cols[1].x, y + 4, { size: 9.5, color: ink, style: "bold" });
    text(doc, `$${row.priceUSD}`, cols[2].x, y + 2, { size: 9, color: ink });
    text(doc, `${row.batteryDays} d`, cols[3].x, y + 2, { size: 9, color: ink });
    text(doc, row.display, cols[4].x, y + 2, { size: 9, color: ink });
    text(doc, `${s.matchPercent}%`, cols[5].x, y + 2, { size: 10, color: i === 0 ? accent : ink, style: "bold", align: "right" });
    // mini bar
    scoreBar(doc, cols[1].x, y + 7, 70, s.matchPercent, i === 0 ? accent : [120, 132, 156]);
    y += 14;
  });

  // Comparison alt + budget
  y += 4;
  if (setup.alt || setup.budget) {
    text(doc, "Smart Alternatives", MARGIN, y, { size: 14, color: ink, style: "bold" });
    y += 8;
    const cards = [setup.alt, setup.budget].filter(Boolean) as ScoredWatch[];
    const cardW = (PAGE_W - MARGIN * 2 - 6) / Math.max(cards.length, 1);
    cards.forEach((s, i) => {
      const cxs = MARGIN + (cardW + 6) * i;
      setFill(doc, ivory);
      doc.roundedRect(cxs, y, cardW, 38, 3, 3, "F");
      setStroke(doc, line);
      doc.roundedRect(cxs, y, cardW, 38, 3, 3, "S");
      text(doc, i === 0 ? "DIFFERENT ECOSYSTEM" : "BUDGET PICK", cxs + 5, y + 7, { size: 6.5, color: accent, style: "bold" });
      text(doc, s.watch.brand, cxs + 5, y + 14, { size: 8, color: muted });
      text(doc, s.watch.model, cxs + 5, y + 20, { size: 11, color: ink, style: "bold" });
      text(doc, `$${s.watch.priceUSD}`, cxs + 5, y + 31, { size: 12, color: accent, style: "bold" });
      text(doc, `${s.matchPercent}% match`, cxs + cardW - 5, y + 31, { size: 8, color: muted, align: "right" });
    });
    y += 44;
  }

  // ====================================================================
  // PAGE 4 — BUYER PROFILE + METHODOLOGY
  // ====================================================================
  newPage(doc, page);
  y = 24;
  text(doc, "Your Buyer Profile", MARGIN, y, { size: 22, color: ink, style: "bold" });
  setFill(doc, accent);
  doc.rect(MARGIN, y + 3, 18, 1, "F");
  y += 14;

  const profile: Array<[string, string]> = [
    ["Primary use", USE_LBL[answers.primaryUse] || "—"],
    ["Phone", PHONE_LBL[answers.phone] || "—"],
    ["Form factor", answers.form || "—"],
    ["Battery target", `${answers.battery} day${answers.battery === 1 ? "" : "s"}`],
    ["Wrist size", `${answers.wristSize} mm`],
    ["Style", answers.style || "—"],
    ["Must-have features", answers.features.map((f) => FEATURE_LBL[f] || f).join(" · ") || "Core fitness"],
    ["Preferred brands", answers.brand.length ? answers.brand.join(", ") : "Open to any"],
    ["Budget", answers.budget.length ? answers.budget.join(", ") : "Flexible"],
  ];
  profile.forEach(([k, v]) => {
    setFill(doc, panel);
    doc.roundedRect(MARGIN, y, PAGE_W - MARGIN * 2, 11, 2, 2, "F");
    text(doc, k.toUpperCase(), MARGIN + 5, y + 7, { size: 7.5, color: accent, style: "bold" });
    text(doc, v, MARGIN + 60, y + 7, { size: 9.5, color: ink });
    y += 13;
  });

  // Methodology
  y += 6;
  text(doc, "Methodology", MARGIN, y, { size: 14, color: ink, style: "bold" });
  y += 8;
  y = wrap(doc,
    `WatchMatch AI scores every watch in our verified database across nine weighted dimensions: primary use, phone ecosystem, form factor, battery, sensor coverage, wrist sizing, style, brand affinity, and budget. Exact-match bonuses reward perfect ecosystem and feature alignment. Scores are then ranked and de-duplicated across brand to surface the strongest cross-section of options.`,
    MARGIN, y, PAGE_W - MARGIN * 2, { size: 9, color: sub, lineHeight: 1.55 });
  y += 6;
  y = wrap(doc,
    `Every product link uses the papalex-20 Amazon Associates tag. We may earn a commission when you buy through these links — it never changes your price and it keeps our research free.`,
    MARGIN, y, PAGE_W - MARGIN * 2, { size: 9, color: sub, lineHeight: 1.55 });

  // Closing brand block
  y = PAGE_H - 60;
  setFill(doc, [10, 14, 22]);
  doc.roundedRect(MARGIN, y, PAGE_W - MARGIN * 2, 38, 3, 3, "F");
  text(doc, "READY TO BUY?", MARGIN + 8, y + 12, { size: 8, color: accent, style: "bold" });
  text(doc, `Open ${w.brand} ${w.model} on Amazon`, MARGIN + 8, y + 22, { size: 13, color: [255, 255, 255], style: "bold" });
  text(doc, "Live price and stock verified at the time of report download.", MARGIN + 8, y + 30, { size: 8, color: [180, 192, 215] });

  const slug = `${w.brand}-${w.model}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  // re-stamp page 1 header now that total is known? totalPages preset.
  doc.save(`GearUpToFit-WatchMatch-${slug}.pdf`);
}
