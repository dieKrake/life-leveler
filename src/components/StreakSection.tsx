import { useState } from "react";
import useSWR from "swr";
import { PlayerStats, StreakMultiplier } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flame, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GRADIENTS } from "@/lib/constants";
import StreakTierCard from "@/components/streak/StreakTierCard";

interface StreakSectionProps {
  stats: PlayerStats;
}

export default function StreakSection({ stats }: StreakSectionProps) {
  const { data: streakMultipliers } = useSWR<StreakMultiplier[]>(
    "/api/streak-multipliers"
  );
  const [isStreakExpanded, setIsStreakExpanded] = useState(false);

  const { current_streak, streak_multiplier } = stats;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={`${GRADIENTS.cardBg} ${GRADIENTS.cardBorder} border backdrop-blur-sm`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <Flame className="h-5 w-5 text-orange-400" />
              Streak & Multiplikator
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsStreakExpanded(!isStreakExpanded)}
              className="flex items-center gap-1 text-slate-300 hover:bg-transparent hover:text-white"
            >
              {isStreakExpanded ? (
                <>
                  Weniger <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  Mehr Details <ChevronDown className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="text-3xl font-bold text-orange-400">
                {current_streak}
              </div>
              <p className="text-sm text-slate-400">Tage in Folge</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white">
                  x{streak_multiplier.toFixed(1)}
                </span>
                {streak_multiplier > 1.0 && (
                  <Badge variant="secondary" className="bg-orange-500 text-white">
                    Aktiv
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-400">XP Multiplikator</p>
            </motion.div>
          </motion.div>

        {/* Expanded Streak Multiplier Tiers */}
        <AnimatePresence>
          {isStreakExpanded && streakMultipliers && (
            <motion.div 
              className="mt-6 pt-6 border-t border-slate-700"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <h4 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
                <Flame className="h-5 w-5 text-orange-500" />
                Streak Multiplikator Stufen
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {streakMultipliers
                  .sort((a, b) => a.min_streak_days - b.min_streak_days)
                  .map((tier, index) => (
                    <StreakTierCard
                      key={tier.id}
                      tier={tier}
                      currentStreak={current_streak}
                      index={index}
                    />
                  ))}
              </div>

              <motion.div 
                className="mt-4 p-3 bg-blue-950/20 rounded-lg border border-blue-800"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: streakMultipliers.length * 0.1 + 0.2 }}
              >
                <p className="text-sm text-blue-300">
                  <strong>Tipp:</strong> Halte deine Streak aufrecht, um höhere
                  XP-Multiplikatoren zu erhalten! Jede erledigte Aufgabe gibt dir
                  mehr Erfahrungspunkte.
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
    </motion.div>
  );
}
