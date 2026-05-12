import { motion } from "framer-motion";

interface Props {
  currentStep: number;
  totalSteps: number;
  progress: number;
}

const stepLabels = ["Use", "Phone", "Form", "Battery", "Features", "Wrist", "Style", "Brand", "Budget"];
const stepIcons = ["🎯", "📱", "⌚", "🔋", "✨", "📏", "🎨", "🏷️", "💰"];

export default function QuizProgress({ currentStep, totalSteps, progress }: Props) {
  return (
    <div className="sticky top-0 z-20 glass-strong px-4 py-3 md:py-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <motion.span
              key={currentStep}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-lg"
            >
              {stepIcons[currentStep] || "📋"}
            </motion.span>
            <motion.span
              key={`l-${currentStep}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xs font-bold uppercase tracking-wider"
            >
              {stepLabels[currentStep] || "Quiz"}
            </motion.span>
          </div>
          <span className="text-xs font-bold text-primary tabular-nums bg-primary/10 px-2.5 py-1 rounded-full">
            {currentStep + 1} / {totalSteps}
          </span>
        </div>
        <div className="relative h-2 bg-secondary/50 rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-primary rounded-full"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow-lg shadow-primary/50"
            initial={false}
            animate={{ left: `calc(${progress}% - 6px)` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </div>
  );
}