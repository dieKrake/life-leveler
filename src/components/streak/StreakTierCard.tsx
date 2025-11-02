import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Flame } from "lucide-react";
import { StreakMultiplier } from "@/types";

interface StreakTierCardProps {
  tier: StreakMultiplier;
  currentStreak: number;
  index: number;
}

export default function StreakTierCard({
  tier,
  currentStreak,
  index,
}: StreakTierCardProps) {
  const isActive = currentStreak >= tier.min_streak_days;
  const daysNeeded = isActive ? 0 : tier.min_streak_days - currentStreak;
  const daysActive = isActive && tier.min_streak_days > 0
    ? currentStreak - tier.min_streak_days + 1
    : 0;

  return (
    <motion.div
      key={tier.id}
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.3,
        delay: index * 0.1,
        type: "spring",
        stiffness: 100,
      }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`p-4 rounded-lg border-2 transition-all ${
        isActive
          ? "border-yellow-100 border-opacity-20 bg-amber-950/20"
          : "border-slate-700 bg-slate-800/50"
      } ${!isActive ? "opacity-75" : ""}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Flame
            className={`h-5 w-5 ${isActive ? "text-orange-500" : "text-slate-500"}`}
          />
          <span className="font-semibold text-white">
            x{tier.multiplier.toFixed(1)}
          </span>
        </div>
        {isActive && (
          <Badge variant="secondary" className="bg-orange-500 text-white text-xs">
            Erreicht
          </Badge>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium text-white">
          {tier.min_streak_days === 0 ? "Standard" : `${tier.min_streak_days}+ Tage`}
        </p>

        {!isActive && daysNeeded > 0 && (
          <p className="text-xs text-slate-400">Noch {daysNeeded} Tage</p>
        )}

        {isActive && daysActive > 0 && (
          <p className="text-xs text-orange-400">
            Seit {daysActive} Tagen aktiv
          </p>
        )}
      </div>
    </motion.div>
  );
}
