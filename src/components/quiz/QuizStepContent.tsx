import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { QuizStep, QuizAnswers, popularBrands } from "@/lib/quiz-data";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Check, Search, X, icons as LucideIcons, type LucideIcon } from "lucide-react";

const renderIcon = (name: string | undefined, isSelected: boolean) => {
  if (!name) return null;
  const Icon = (LucideIcons as Record<string, LucideIcon>)[name];
  if (!Icon) return null;
  return (
    <span
      className={`relative mb-2.5 inline-flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-xl transition-all ${
        isSelected
          ? "bg-gradient-to-br from-primary/25 to-primary/5 ring-1 ring-primary/40"
          : "bg-gradient-to-br from-muted/40 to-muted/10 ring-1 ring-border/40 group-hover:ring-primary/30"
      }`}
    >
      <Icon
        className={`w-5 h-5 md:w-6 md:h-6 ${isSelected ? "text-primary" : "text-foreground/70 group-hover:text-primary"}`}
        strokeWidth={2}
      />
    </span>
  );
};

interface Props {
  step: QuizStep;
  answers: QuizAnswers;
  setAnswer: (key: string, value: string | number | string[]) => void;
  handleMultiSelect: (stepId: string, value: string) => void;
  onAutoAdvance?: () => void;
}

const sliderKey: Record<string, "battery" | "wristSize"> = {
  battery: "battery",
  wristSize: "wristSize",
};

export default function QuizStepContent({
  step,
  answers,
  setAnswer,
  handleMultiSelect,
  onAutoAdvance,
}: Props) {
  const [brandSearch, setBrandSearch] = useState("");
  const filteredBrands = useMemo(() => {
    if (!brandSearch) return popularBrands;
    return popularBrands.filter((b) => b.toLowerCase().includes(brandSearch.toLowerCase()));
  }, [brandSearch]);
  const selectedBrands = answers.brand;

  const toggleBrand = (b: string) => {
    const lower = b.toLowerCase();
    if (selectedBrands.includes(lower)) {
      setAnswer("brand", selectedBrands.filter((x) => x !== lower));
    } else {
      setAnswer("brand", [...selectedBrands, lower]);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 25 } },
  };

  const sliderTarget = sliderKey[step.id];
  const sliderValue = sliderTarget ? (answers[sliderTarget] as number) : 0;

  return (
    <div>
      <div className="mb-6 md:mb-8">
        <h2 className="text-2xl md:text-4xl font-bold uppercase tracking-tight mb-2 leading-tight">
          {step.title}
        </h2>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{step.subtitle}</p>
        {(step.type === "multi" || step.type === "brand-multi") && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-1.5 mt-3 text-xs text-primary font-semibold uppercase tracking-wider bg-primary/10 px-3 py-1.5 rounded-full"
          >
            <Check className="w-3 h-3" />
            Select all that apply
          </motion.span>
        )}
      </div>

      {/* Slider */}
      {step.type === "slider" && step.sliderConfig && sliderTarget && (
        <div className="space-y-6">
          <div className="text-center py-4">
            <div className="glass rounded-2xl inline-flex items-baseline gap-1 px-8 py-5">
              <motion.span
                key={sliderValue}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-5xl md:text-7xl font-bold text-gradient tabular-nums"
              >
                {sliderValue}
              </motion.span>
              <span className="text-lg md:text-2xl text-muted-foreground ml-2 font-light">
                {step.sliderConfig.unit}
              </span>
            </div>
          </div>
          <div className="px-2">
            <Slider
              value={[sliderValue]}
              min={step.sliderConfig.min}
              max={step.sliderConfig.max}
              step={step.sliderConfig.step}
              onValueChange={([v]) => setAnswer(sliderTarget, v)}
              className="py-4"
            />
          </div>
          {step.sliderConfig.labels && (
            <div className="flex justify-between text-[10px] md:text-xs text-muted-foreground px-1">
              {step.sliderConfig.labels.map((l) => (
                <span key={l}>{l}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Brand */}
      {step.type === "brand-multi" && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              placeholder="Search brands..."
              className="pl-11 h-12 md:h-14 text-base bg-card/50 border-border/50 rounded-xl focus:border-primary"
            />
            {brandSearch && (
              <button
                onClick={() => setBrandSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {selectedBrands.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedBrands.map((b) => (
                <button
                  key={b}
                  onClick={() => toggleBrand(b)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/20 text-primary text-xs font-semibold border border-primary/30"
                >
                  {b.charAt(0).toUpperCase() + b.slice(1)}
                  <X className="w-3 h-3" />
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => setAnswer("brand", [])}
            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
              selectedBrands.length === 0
                ? "border-primary bg-primary/10 glow-primary-sm"
                : "border-border/50 bg-card/50 hover:border-muted-foreground/30"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🌐</span>
              <div>
                <span className="font-semibold text-sm">No Preference</span>
                <span className="block text-xs text-muted-foreground">
                  We'll recommend based on fit, not brand
                </span>
              </div>
            </div>
          </button>

          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 font-medium">
              {brandSearch ? `Results for "${brandSearch}"` : "Popular brands — select one or more"}
            </p>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-3 sm:grid-cols-4 gap-2"
            >
              {filteredBrands.slice(0, 16).map((brand) => {
                const isSelected = selectedBrands.includes(brand.toLowerCase());
                return (
                  <motion.button
                    key={brand}
                    variants={itemVariants}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => toggleBrand(brand)}
                    className={`relative p-3 rounded-xl border transition-all text-center ${
                      isSelected
                        ? "border-primary bg-primary/10 glow-primary-sm"
                        : "border-border/50 bg-card/30 hover:border-muted-foreground/30"
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-primary-foreground" />
                      </span>
                    )}
                    <span className="font-semibold text-xs md:text-sm">{brand}</span>
                  </motion.button>
                );
              })}
            </motion.div>
          </div>
        </div>
      )}

      {/* Options */}
      {(step.type === "single" || step.type === "multi") && step.options && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className={`grid gap-2.5 md:gap-3 ${
            step.options.length <= 4
              ? "grid-cols-2"
              : step.options.length <= 6
                ? "grid-cols-2 sm:grid-cols-3"
                : "grid-cols-2 sm:grid-cols-3"
          }`}
        >
          {step.options.map((option) => {
            const isSelected =
              step.type === "multi"
                ? (answers[step.id as keyof QuizAnswers] as string[]).includes(option.value)
                : answers[step.id as keyof QuizAnswers] === option.value;

            return (
              <motion.button
                key={option.value}
                variants={itemVariants}
                onClick={() => {
                  if (step.type === "multi") {
                    handleMultiSelect(step.id, option.value);
                  } else {
                    setAnswer(step.id, option.value);
                    if (onAutoAdvance) setTimeout(() => onAutoAdvance(), 280);
                  }
                }}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className={`relative flex flex-col items-center justify-center text-center p-3 md:p-5 rounded-2xl border-2 transition-all group overflow-hidden min-h-[110px] md:min-h-[140px] ${
                  isSelected
                    ? "border-primary bg-primary/10 glow-primary-sm shadow-lg shadow-primary/20"
                    : "border-border/50 bg-card/40 hover:border-primary/40 hover:bg-card/70"
                }`}
              >
                {isSelected && <div className="absolute inset-0 shimmer pointer-events-none" />}
                {isSelected && (
                  <span className="absolute top-2 right-2 w-5 h-5 md:w-6 md:h-6 rounded-full bg-primary flex items-center justify-center shadow-lg z-10">
                    <Check className="w-3 h-3 md:w-3.5 md:h-3.5 text-primary-foreground" strokeWidth={3} />
                  </span>
                )}
                {option.icon && renderIcon(option.icon, isSelected)}
                <span className="font-bold text-xs md:text-sm leading-tight">{option.label}</span>
                {option.description && (
                  <span className="text-[10px] md:text-xs text-muted-foreground mt-1 leading-snug line-clamp-2">
                    {option.description}
                  </span>
                )}
              </motion.button>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}