import { useState, useCallback, useEffect, useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  quizSteps,
  QuizAnswers,
  defaultAnswers,
  generateSlug,
  encodeAnswers,
} from "@/lib/quiz-data";
import QuizHero from "@/components/quiz/QuizHero";
import QuizProgress from "@/components/quiz/QuizProgress";
import QuizStepContent from "@/components/quiz/QuizStepContent";
import QuizNavigation from "@/components/quiz/QuizNavigation";
import { Brain } from "lucide-react";
import { captureUTM } from "@/lib/utm";

export const Route = createFileRoute("/")({
  head: () => {
    const SITE = "https://wrist-wonderland-hub.lovable.app";
    const webAppLd = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "WatchMatch AI",
      url: SITE,
      applicationCategory: "LifestyleApplication",
      operatingSystem: "Any",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      description:
        "Free AI-powered smartwatch and fitness band finder. 9 expert questions, one perfect match across Apple, Garmin, Samsung, Google, Fitbit, Polar, Coros and Suunto.",
      publisher: {
        "@type": "Organization",
        name: "GearUpToFit",
        url: "https://gearuptofit.com",
      },
    };
    const faqLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "How does WatchMatch AI pick a watch for me?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "WatchMatch runs your 9 quiz answers through a deterministic scoring engine that weighs phone compatibility, battery, GPS, training features, case size and budget against our hand-verified watch database. The same answers always produce the same ranking — no random shuffling and no commission-weighted nudges.",
          },
        },
        {
          "@type": "Question",
          name: "Is the quiz really free?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. The quiz, the match, the PDF report and the comparison pages are all free forever. We earn a small commission only if you choose to buy through one of our Amazon links — at no extra cost to you.",
          },
        },
        {
          "@type": "Question",
          name: "Do you favour brands that pay you more?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. The scoring engine is commission-blind: affiliate links are added after the score is computed. If the #1 match earns us nothing and the #4 match earns us $30, the #1 match still wins.",
          },
        },
        {
          "@type": "Question",
          name: "Which brands do you cover?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Apple, Garmin, Samsung, Google Pixel, Fitbit, Polar, Coros, Suunto, Amazfit and more — every flagship and most popular mid-range models.",
          },
        },
      ],
    };
    return {
      meta: [
      { title: "WatchMatch AI — Find Your Perfect Smartwatch in 2 Minutes" },
      {
        name: "description",
        content:
          "Free AI-powered smartwatch & fitness band finder by GearUpToFit. 9 expert questions, one perfect match across Apple, Garmin, Samsung, Google, Fitbit, Polar, Coros, Suunto and more.",
      },
      { property: "og:title", content: "WatchMatch AI — Find Your Perfect Smartwatch" },
      {
        property: "og:description",
        content:
          "9 questions, one perfect smartwatch or fitness band recommendation — scored against verified specs.",
      },
    ],
    links: [
      { rel: "canonical", href: "https://gearuptofit.com/watch-match/" },
    ],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(webAppLd) },
        { type: "application/ld+json", children: JSON.stringify(faqLd) },
      ],
    };
  },
  component: Index,
});

function Index() {
  const [currentStep, setCurrentStep] = useState(-1);
  const [answers, setAnswers] = useState<QuizAnswers>(defaultAnswers);
  const navigate = useNavigate();

  // Capture UTM parameters on first landing so every downstream lead-capture
  // event is tagged with the original traffic source.
  useEffect(() => {
    captureUTM();
  }, []);

  const progress = currentStep >= 0 ? ((currentStep + 1) / quizSteps.length) * 100 : 0;

  const answeredCount = useMemo(() => {
    let c = 0;
    if (answers.primaryUse) c++;
    if (answers.phone) c++;
    if (answers.form) c++;
    if (answers.battery !== 7) c++;
    if (answers.features.length > 0) c++;
    if (answers.wristSize !== 170) c++;
    if (answers.style) c++;
    if (answers.brand.length > 0) c++;
    if (answers.budget.length > 0) c++;
    return c;
  }, [answers]);

  const confidence = Math.round((answeredCount / 9) * 100);

  const setAnswer = useCallback((key: string, value: string | number | string[]) => {
    setAnswers((p) => ({ ...p, [key]: value }));
  }, []);

  const canProceed = () => {
    if (currentStep < 0) return true;
    const s = quizSteps[currentStep];
    const v = answers[s.id as keyof QuizAnswers];
    if (s.type === "slider") return true;
    if (s.type === "brand-multi") return true;
    if (s.type === "multi") return (v as string[]).length > 0;
    return !!v;
  };

  const handleNext = useCallback(() => {
    setCurrentStep((p) => {
      if (p < quizSteps.length - 1) return p + 1;
      const slug = generateSlug(answers);
      const encoded = encodeAnswers(answers);
      navigate({ to: "/watch-match/$slug", params: { slug }, search: { d: encoded } });
      return p;
    });
  }, [answers, navigate]);

  const handleBack = () => setCurrentStep((p) => Math.max(-1, p - 1));

  const handleMultiSelect = useCallback((stepId: string, value: string) => {
    setAnswers((prev) => {
      const cur = prev[stepId as keyof QuizAnswers] as string[];
      if (cur.includes(value)) {
        return { ...prev, [stepId]: cur.filter((v) => v !== value) };
      }
      return { ...prev, [stepId]: [...cur, value] };
    });
  }, []);

  if (currentStep === -1) {
    return <QuizHero onStart={() => setCurrentStep(0)} />;
  }

  const step = quizSteps[currentStep];
  const isLast = currentStep === quizSteps.length - 1;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-dark relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      {step.bgImage && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`bg-${currentStep}`}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="fixed inset-0 pointer-events-none"
            aria-hidden
          >
            <img
              src={step.bgImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-45"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/45 to-background/92" />
          </motion.div>
        </AnimatePresence>
      )}

      <QuizProgress currentStep={currentStep} totalSteps={quizSteps.length} progress={progress} />

      <div className="flex-1 flex items-center justify-center px-4 py-6 md:py-8 relative z-10">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 60, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -60, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <QuizStepContent
                step={step}
                answers={answers}
                setAnswer={setAnswer}
                handleMultiSelect={handleMultiSelect}
                onAutoAdvance={step.type === "single" ? handleNext : undefined}
              />
            </motion.div>
          </AnimatePresence>

          {currentStep >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-6 glass rounded-xl p-3 flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Brain className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    AI Confidence
                  </span>
                  <span className="text-xs font-bold text-primary">{confidence}%</span>
                </div>
                <div className="h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-primary rounded-full"
                    initial={false}
                    animate={{ width: `${confidence}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <QuizNavigation
        onBack={handleBack}
        onNext={handleNext}
        canProceed={canProceed()}
        isLast={isLast}
        hideNext={step.type === "single"}
      />
    </div>
  );
}