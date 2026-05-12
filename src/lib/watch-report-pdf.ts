import jsPDF from "jspdf";
import type { QuizAnswers } from "./quiz-data";
import type { WatchRecommendation } from "./recommendation-engine";
import type { ScoredWatch, WatchSetup } from "./scoring-engine";
import { WATCH_DB_LAST_UPDATED } from "./watch-database";

type RGB = readonly [number, number, number];

const ink: RGB = [18, 24, 35];
const muted: RGB = [92, 103, 122];
const red: RGB = [224, 35, 46];
const panel: RGB = [245, 247, 250];

function text(doc: jsPDF, value: string, x: number, y: number, size = 10, color = ink, style: "normal" | "bold" = "normal") {
  doc.setFont("helvetica", style);
  doc.setFontSize(size);
  doc.setTextColor(color[0], color[1], color[2]);
  doc.text(value, x, y);
}

function wrap(doc: jsPDF, value: string, x: number, y: number, width: number, size = 10, color = ink) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(size);
  doc.setTextColor(color[0], color[1], color[2]);
  const lines = doc.splitTextToSize(value, width);
  doc.text(lines, x, y);
  return y + lines.length * (size * 0.42 + 2);
}

function watchLine(doc: jsPDF, item: ScoredWatch, rank: number, y: number) {
  doc.setFillColor(panel[0], panel[1], panel[2]);
  doc.roundedRect(14, y - 6, 182, 20, 3, 3, "F");
  text(doc, `#${rank}`, 20, y + 5, 12, red, "bold");
  text(doc, `${item.watch.brand} ${item.watch.model}`, 38, y + 1, 11, ink, "bold");
  text(doc, `$${item.watch.priceUSD} · ${item.watch.batteryDays}d battery · ${item.watch.display} · ${item.watch.waterRating}`, 38, y + 8, 8, muted);
  text(doc, `${item.matchPercent}%`, 178, y + 5, 12, red, "bold");
}

export function generateWatchReportPDF(data: {
  answers: QuizAnswers;
  recommendation: WatchRecommendation;
  setup: WatchSetup;
  top: ScoredWatch[];
}) {
  const { answers, recommendation, setup, top } = data;
  const primary = setup.primary.watch;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  doc.setFillColor(12, 18, 29);
  doc.rect(0, 0, 210, 52, "F");
  text(doc, "GEARUPTOFIT · WATCHMATCH AI", 14, 15, 8, [255, 255, 255], "bold");
  text(doc, "Personalized Smartwatch Report", 14, 29, 22, [255, 255, 255], "bold");
  text(doc, `Database verified · ${WATCH_DB_LAST_UPDATED}`, 14, 42, 8, [205, 212, 224]);
  text(doc, `${setup.primary.matchPercent}%`, 170, 28, 20, red, "bold");
  text(doc, "MATCH", 174, 38, 7, [205, 212, 224], "bold");

  let y = 66;
  text(doc, "#1 MATCH", 14, y, 9, red, "bold");
  text(doc, `${primary.brand} ${primary.model}`, 14, y + 12, 20, ink, "bold");
  y = wrap(doc, primary.highlight, 14, y + 23, 178, 10, muted) + 3;
  text(doc, `Profile: ${recommendation.profile.category}`, 14, y, 10, ink, "bold");
  y = wrap(doc, recommendation.profile.summary, 14, y + 8, 178, 9, muted) + 6;

  doc.setFillColor(panel[0], panel[1], panel[2]);
  doc.roundedRect(14, y, 182, 34, 3, 3, "F");
  text(doc, "Key specs", 20, y + 9, 9, ink, "bold");
  text(doc, `$${primary.priceUSD}`, 20, y + 20, 9, muted);
  text(doc, `${primary.batteryDays} days`, 62, y + 20, 9, muted);
  text(doc, `${primary.caseSizeMM} mm`, 108, y + 20, 9, muted);
  text(doc, `${primary.display}`, 152, y + 20, 9, muted);
  y += 48;

  text(doc, "Why this is the best match", 14, y, 13, ink, "bold");
  y = wrap(doc, recommendation.why, 14, y + 9, 178, 9, muted) + 6;

  text(doc, "Your top watches", 14, y, 13, ink, "bold");
  y += 12;
  top.slice(0, 5).forEach((item, index) => {
    watchLine(doc, item, index + 1, y);
    y += 24;
  });

  doc.addPage();
  text(doc, "Buyer profile", 14, 18, 18, ink, "bold");
  const rows = [
    ["Use", answers.primaryUse],
    ["Phone", answers.phone],
    ["Form", answers.form],
    ["Battery target", `${answers.battery} days`],
    ["Wrist", `${answers.wristSize} mm`],
    ["Style", answers.style],
    ["Features", answers.features.join(", ") || "Core fitness"],
    ["Budget", answers.budget.join(", ") || "Flexible"],
  ];
  y = 34;
  rows.forEach(([label, value]) => {
    text(doc, label, 14, y, 8, red, "bold");
    wrap(doc, value, 58, y, 130, 9, ink);
    y += 13;
  });
  y += 8;
  text(doc, "Action plan", 14, y, 13, ink, "bold");
  y += 10;
  recommendation.emphasis.forEach((item) => {
    y = wrap(doc, `• ${item}`, 18, y, 170, 9, muted) + 3;
  });

  const slug = `${primary.brand}-${primary.model}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  doc.save(`GearUpToFit-WatchMatch-Report-${slug}.pdf`);
}