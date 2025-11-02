import { motion } from "framer-motion";
import { GRADIENTS } from "@/lib/constants";

interface ProgressBarProps {
  progress: number;
  total: number;
  showLabel?: boolean;
  gradient?: keyof typeof GRADIENTS;
  height?: "sm" | "md" | "lg";
  animated?: boolean;
  delay?: number;
}

const HEIGHT_CLASSES = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3",
};

export default function ProgressBar({
  progress,
  total,
  showLabel = false,
  gradient = "xpProgress",
  height = "md",
  animated = true,
  delay = 0,
}: ProgressBarProps) {
  const percentage = total > 0 ? Math.min((progress / total) * 100, 100) : 0;
  const heightClass = HEIGHT_CLASSES[height];

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>Fortschritt</span>
          <span>
            {progress}/{total}
          </span>
        </div>
      )}
      <div className={`w-full bg-slate-700 rounded-full overflow-hidden ${heightClass}`}>
        {animated ? (
          <motion.div
            className={`${heightClass} bg-gradient-to-r ${GRADIENTS[gradient]} rounded-full transition-all duration-500`}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1.2, delay, ease: "easeOut" }}
          />
        ) : (
          <div
            className={`${heightClass} bg-gradient-to-r ${GRADIENTS[gradient]} rounded-full transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          />
        )}
      </div>
    </div>
  );
}
