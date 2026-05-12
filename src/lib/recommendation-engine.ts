import { QuizAnswers } from "./quiz-data";

export interface WatchRecommendation {
  profile: {
    category: string;
    summary: string;
    batteryTarget: string;
    sensorPriority: string;
    formFactor: string;
  };
  why: string;
  emphasis: string[];
}

const USE_LABEL: Record<string, string> = {
  running: "Runner",
  multisport: "Multisport Athlete",
  outdoor: "Outdoor Adventurer",
  gym: "Gym & Strength Trainer",
  everyday: "Everyday Wellness User",
  health: "Health Tracker",
};

const FORM_LABEL: Record<string, string> = {
  smartwatch: "full smartwatch",
  sportwatch: "training-grade sport watch",
  band: "lightweight fitness band",
  hybrid: "analog-look hybrid",
};

export function generateRecommendation(a: QuizAnswers): WatchRecommendation {
  const useLabel = USE_LABEL[a.primaryUse] || "Everyday User";
  const formLabel = FORM_LABEL[a.form] || "smartwatch";

  const category = `${a.style ? a.style.charAt(0).toUpperCase() + a.style.slice(1) + " " : ""}${useLabel}`;

  const sensorPriority = a.features.length
    ? a.features.map((f) => f.toUpperCase()).join(" · ")
    : "Core fitness sensors";

  const batteryTarget =
    a.battery >= 21 ? "Ultra-long (3+ weeks)" :
    a.battery >= 14 ? "Extended (2 weeks)" :
    a.battery >= 7 ? "Week-long" :
    a.battery >= 3 ? "Multi-day" : "Daily charge";

  const summary = `A ${a.style || "modern"} ${formLabel} with ${batteryTarget.toLowerCase()} battery, optimized for ${a.primaryUse || "everyday"} on ${a.phone === "iphone" ? "iPhone" : a.phone === "android" ? "Android" : "any phone"}.`;

  const whyParts: string[] = [];
  whyParts.push(
    `As a ${useLabel.toLowerCase()}, you'll get the most out of a ${formLabel} that prioritizes ${a.features.includes("gps") ? "accurate GPS, " : ""}${a.features.includes("ecg") || a.features.includes("spo2") ? "medical-grade health sensors, " : ""}and ${batteryTarget.toLowerCase()} battery life.`,
  );
  if (a.phone && a.phone !== "both") {
    whyParts.push(
      `Because you're on ${a.phone === "iphone" ? "iPhone" : "Android"}, we filtered to watches that pair completely — including notifications, replies and contactless payments.`,
    );
  }
  if (a.brand.length > 0) {
    whyParts.push(
      `You like ${a.brand.map((b) => b[0].toUpperCase() + b.slice(1)).join(", ")}, so we kept those brands at the top when the spec match was strong.`,
    );
  }

  const emphasis: string[] = [];
  switch (a.primaryUse) {
    case "running":
      emphasis.push("Look for dual-frequency (multi-band) GPS for accurate pace in cities and forests.");
      emphasis.push("Use the watch's training load and recovery scores to time hard sessions.");
      break;
    case "multisport":
      emphasis.push("Prioritize a watch with multisport mode — auto-transitions between swim/bike/run.");
      emphasis.push("Make sure it supports external sensors (HR strap, power meter, foot pod) over ANT+ or BLE.");
      break;
    case "outdoor":
      emphasis.push("Offline topo maps and a barometric altimeter are non-negotiable for safety in the backcountry.");
      emphasis.push("Solar charging or 20+ day battery means fewer power anxieties on multi-day trips.");
      break;
    case "gym":
      emphasis.push("Strength training mode tracks reps, sets and rest time automatically.");
      emphasis.push("A bright AMOLED display reads easily under harsh gym lighting.");
      break;
    case "everyday":
      emphasis.push("Lean into sleep tracking and stress scores to spot recovery trends over weeks.");
      emphasis.push("Always-on display + contactless pay are the daily-driver upgrades you'll feel most.");
      break;
    case "health":
      emphasis.push("Use ECG and SpO2 readings as trends, not single data points — share with your doctor.");
      emphasis.push("HRV-based readiness scores help you spot illness or overtraining before symptoms appear.");
      break;
  }
  if (a.battery >= 14) {
    emphasis.push("Disable always-on display + lower screen brightness to push battery past spec-sheet numbers.");
  }

  return {
    profile: {
      category,
      summary,
      batteryTarget,
      sensorPriority,
      formFactor: formLabel,
    },
    why: whyParts.join(" "),
    emphasis,
  };
}