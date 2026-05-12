import qbgUse from "@/assets/qbg-use.jpg";
import qbgPhone from "@/assets/qbg-phone.jpg";
import qbgForm from "@/assets/qbg-form.jpg";
import qbgBattery from "@/assets/qbg-battery.jpg";
import qbgFeatures from "@/assets/qbg-features.jpg";
import qbgWrist from "@/assets/qbg-wrist.jpg";
import qbgStyle from "@/assets/qbg-style.jpg";
import qbgBrand from "@/assets/qbg-brand.jpg";
import qbgBudget from "@/assets/qbg-budget.jpg";

export interface QuizOption {
  value: string;
  label: string;
  description?: string;
  icon?: string;
}

export interface QuizStep {
  id: string;
  title: string;
  subtitle: string;
  type: "single" | "multi" | "slider" | "brand-multi";
  options?: QuizOption[];
  sliderConfig?: { min: number; max: number; step: number; unit: string; labels?: string[] };
  bgImage?: string;
}

export const quizSteps: QuizStep[] = [
  {
    id: "primaryUse",
    title: "What will you use it for most?",
    subtitle: "Your top activity drives the sensors and battery profile we need.",
    type: "single",
    bgImage: qbgUse,
    options: [
      { value: "running", label: "Running", description: "GPS pace, cadence, training load", icon: "Footprints" },
      { value: "multisport", label: "Multisport", description: "Triathlon, swim+bike+run", icon: "Activity" },
      { value: "outdoor", label: "Outdoor / Adventure", description: "Hiking, trail, expeditions", icon: "Mountain" },
      { value: "gym", label: "Gym & Strength", description: "HIIT, weights, functional", icon: "Dumbbell" },
      { value: "everyday", label: "Everyday & Wellness", description: "Steps, sleep, notifications", icon: "Heart" },
      { value: "health", label: "Health Tracking", description: "ECG, SpO2, HRV, recovery", icon: "Stethoscope" },
    ],
  },
  {
    id: "phone",
    title: "Which phone do you use?",
    subtitle: "Some watches only pair fully with iPhone or Android.",
    type: "single",
    bgImage: qbgPhone,
    options: [
      { value: "iphone", label: "iPhone", description: "iOS 16 or newer", icon: "Apple" },
      { value: "android", label: "Android", description: "Pixel, Samsung, OnePlus…", icon: "Smartphone" },
      { value: "both", label: "Either / Both", description: "I switch or share devices", icon: "Shuffle" },
    ],
  },
  {
    id: "form",
    title: "Watch or band?",
    subtitle: "Pick the form factor that fits your lifestyle and wrist.",
    type: "single",
    bgImage: qbgForm,
    options: [
      { value: "smartwatch", label: "Smartwatch", description: "Full screen, apps, payments", icon: "Watch" },
      { value: "sportwatch", label: "Sport / GPS Watch", description: "Rugged, training-first", icon: "Timer" },
      { value: "band", label: "Fitness Band", description: "Slim, lightweight, discreet", icon: "Minus" },
      { value: "hybrid", label: "Hybrid", description: "Analog look + smart features", icon: "CircleDot" },
    ],
  },
  {
    id: "battery",
    title: "Battery life expectation",
    subtitle: "How many days do you want between charges?",
    type: "slider",
    bgImage: qbgBattery,
    sliderConfig: { min: 1, max: 30, step: 1, unit: "days", labels: ["1 day", "7 days", "14 days", "21 days", "30+ days"] },
  },
  {
    id: "features",
    title: "Must-have features",
    subtitle: "Pick everything that matters to you. We'll match against verified specs.",
    type: "multi",
    bgImage: qbgFeatures,
    options: [
      { value: "gps", label: "Built-in GPS", icon: "MapPin" },
      { value: "ecg", label: "ECG", icon: "HeartPulse" },
      { value: "spo2", label: "Blood O₂ (SpO2)", icon: "Activity" },
      { value: "music", label: "Onboard Music", icon: "Music" },
      { value: "lte", label: "LTE / Cellular", icon: "Signal" },
      { value: "payments", label: "Contactless Pay", icon: "CreditCard" },
      { value: "amoled", label: "AMOLED Display", icon: "Sun" },
      { value: "maps", label: "Offline Maps", icon: "Map" },
      { value: "swim", label: "Swim-proof 5ATM+", icon: "Waves" },
    ],
  },
  {
    id: "wristSize",
    title: "Wrist size",
    subtitle: "Slide to your wrist circumference (mm) — affects fit and case size.",
    type: "slider",
    bgImage: qbgWrist,
    sliderConfig: { min: 130, max: 220, step: 5, unit: "mm", labels: ["130", "150", "170", "190", "220"] },
  },
  {
    id: "style",
    title: "Style preference",
    subtitle: "How should it look on your wrist?",
    type: "single",
    bgImage: qbgStyle,
    options: [
      { value: "minimal", label: "Minimal", description: "Clean, slim, understated", icon: "Minus" },
      { value: "rugged", label: "Rugged", description: "Tactical, tough, oversized", icon: "Shield" },
      { value: "luxury", label: "Luxury", description: "Premium materials, polished", icon: "Gem" },
      { value: "sporty", label: "Sporty", description: "Bold, colorful, athletic", icon: "Zap" },
    ],
  },
  {
    id: "brand",
    title: "Brand preference",
    subtitle: "Pick brands you like, or skip if you have no preference.",
    type: "brand-multi",
    bgImage: qbgBrand,
  },
  {
    id: "budget",
    title: "Budget range",
    subtitle: "Select one or more price ranges you're comfortable with.",
    type: "multi",
    bgImage: qbgBudget,
    options: [
      { value: "under-100", label: "Under $100", description: "Essentials & bands", icon: "DollarSign" },
      { value: "100-250", label: "$100 – $250", description: "Mid-range sweet spot", icon: "Wallet" },
      { value: "250-500", label: "$250 – $500", description: "Premium performance", icon: "Gem" },
      { value: "500-plus", label: "$500+", description: "Flagship & adventure", icon: "Crown" },
    ],
  },
];

export const popularBrands = [
  "Apple", "Samsung", "Garmin", "Google", "Fitbit", "Huawei", "Polar",
  "Suunto", "Coros", "Amazfit", "Xiaomi", "Withings", "Oppo", "OnePlus",
  "Honor", "Mobvoi", "Fossil", "TAG Heuer", "Casio", "Whoop",
];

export interface QuizAnswers {
  primaryUse: string;
  phone: string;
  form: string;
  battery: number;
  features: string[];
  wristSize: number;
  style: string;
  brand: string[];
  budget: string[];
}

export const defaultAnswers: QuizAnswers = {
  primaryUse: "",
  phone: "",
  form: "",
  battery: 7,
  features: [],
  wristSize: 170,
  style: "",
  brand: [],
  budget: [],
};

export function generateSlug(a: QuizAnswers): string {
  return [a.primaryUse || "everyday", a.phone || "both", a.form || "smartwatch", a.style || "sporty"]
    .map((p) => p.toLowerCase().replace(/\s+/g, "-"))
    .join("-");
}

export function encodeAnswers(a: QuizAnswers): string {
  if (typeof window === "undefined") return Buffer.from(JSON.stringify(a)).toString("base64");
  return btoa(JSON.stringify(a));
}

export function decodeAnswers(encoded: string): QuizAnswers | null {
  try {
    const raw = typeof window === "undefined"
      ? Buffer.from(encoded, "base64").toString("utf-8")
      : atob(encoded);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const VALID_USE = new Set(["running", "multisport", "outdoor", "gym", "everyday", "health"]);
const VALID_PHONE = new Set(["iphone", "android", "both"]);
const VALID_FORM = new Set(["smartwatch", "sportwatch", "band", "hybrid"]);
const VALID_STYLE = new Set(["minimal", "rugged", "luxury", "sporty"]);

export function answersFromSlug(slug: string | undefined): QuizAnswers | null {
  if (!slug) return null;
  const tokens = slug.toLowerCase().split("-").filter(Boolean);
  if (tokens.length < 4) return null;
  const [primaryUse, phone, form, style] = tokens;
  if (!VALID_USE.has(primaryUse) || !VALID_PHONE.has(phone) || !VALID_FORM.has(form) || !VALID_STYLE.has(style))
    return null;
  return {
    primaryUse,
    phone,
    form,
    battery: form === "sportwatch" ? 14 : form === "band" ? 10 : 5,
    features: ["gps"],
    wristSize: 170,
    style,
    brand: [],
    budget: ["under-100", "100-250", "250-500", "500-plus"],
  };
}