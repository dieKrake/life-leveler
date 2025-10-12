"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Gem, Trophy, Star, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RewardData {
  xp?: number;
  gems?: number;
  type: "todo" | "challenge" | "achievement" | "level_up";
  title?: string;
  description?: string;
}

interface RewardNotificationProps {
  reward: RewardData | null;
  index: number;
  onComplete: () => void;
}

export default function RewardNotification({
  reward,
  index,
  onComplete,
}: RewardNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    if (reward && !hasShown) {
      // Small delay based on index for staggered appearance
      const showTimer = setTimeout(() => {
        setIsVisible(true);
        setHasShown(true);
      }, index * 100);

      return () => clearTimeout(showTimer);
    }
  }, [reward, hasShown, index]);

  useEffect(() => {
    if (isVisible) {
      // Auto-hide after 4 seconds (independent of index)
      const hideTimer = setTimeout(() => {
        setIsVisible(false);
      }, 4000);

      return () => clearTimeout(hideTimer);
    }
  }, [isVisible]);

  useEffect(() => {
    if (hasShown && !isVisible) {
      // Call onComplete after exit animation
      const completeTimer = setTimeout(onComplete, 500);
      return () => clearTimeout(completeTimer);
    }
  }, [hasShown, isVisible, onComplete]);

  if (!reward) return null;

  const getTypeConfig = () => {
    switch (reward.type) {
      case "todo":
        return {
          icon: Zap,
          color: "from-blue-500 to-cyan-500",
          bgColor: "from-blue-500/20 to-cyan-500/20",
          borderColor: "border-blue-500/30",
          title: reward.title || "Todo erledigt!",
          description: reward.description || "Großartige Arbeit!",
        };
      case "challenge":
        return {
          icon: Trophy,
          color: "from-purple-500 to-pink-500",
          bgColor: "from-purple-500/20 to-pink-500/20",
          borderColor: "border-purple-500/30",
          title: reward.title || "Challenge gemeistert!",
          description: reward.description || "Herausforderung erfolgreich abgeschlossen!",
        };
      case "achievement":
        return {
          icon: Star,
          color: "from-yellow-500 to-orange-500",
          bgColor: "from-yellow-500/20 to-orange-500/20",
          borderColor: "border-yellow-500/30",
          title: reward.title || "Erfolg freigeschaltet!",
          description: reward.description || "Du hast einen neuen Meilenstein erreicht!",
        };
      case "level_up":
        return {
          icon: Sparkles,
          color: "from-emerald-500 to-teal-500",
          bgColor: "from-emerald-500/20 to-teal-500/20",
          borderColor: "border-emerald-500/30",
          title: reward.title || "Level Up!",
          description: reward.description || "Du bist aufgestiegen!",
        };
      default:
        return {
          icon: Zap,
          color: "from-blue-500 to-cyan-500",
          bgColor: "from-blue-500/20 to-cyan-500/20",
          borderColor: "border-blue-500/30",
          title: "Belohnung erhalten!",
          description: "Gut gemacht!",
        };
    }
  };

  const config = getTypeConfig();
  const IconComponent = config.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, x: -20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.8, x: 20 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 25,
          }}
          className="w-full"
        >
          <div
            className={cn(
              "relative overflow-hidden rounded-2xl border backdrop-blur-xl shadow-2xl",
              `bg-gradient-to-br ${config.bgColor}`,
              config.borderColor,
              "w-full"
            )}
          >
            {/* Removed sparkles animation */}

            {/* Main content */}
            <div className="relative p-6">
              <div className="flex items-start gap-4">
                {/* Icon with pulse animation */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                    delay: 0.2,
                  }}
                  className={cn(
                    "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
                    `bg-gradient-to-br ${config.color}`,
                    "shadow-lg"
                  )}
                >
                  <IconComponent className="w-6 h-6 text-white" />
                </motion.div>

                {/* Text content */}
                <div className="flex-1 min-w-0">
                  <motion.h3
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-lg font-bold text-white mb-1"
                  >
                    {config.title}
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-sm text-slate-300 mb-3"
                  >
                    {config.description}
                  </motion.p>

                  {/* Rewards display */}
                  <div className="flex items-center gap-3">
                    {reward.xp && reward.xp !== 0 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 20,
                          delay: 0.5,
                        }}
                        className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-yellow-500/30 to-orange-500/30 rounded-full border border-yellow-500/40"
                      >
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm font-bold text-yellow-100">
                          {reward.xp > 0 ? "+" : ""}{reward.xp}
                        </span>
                      </motion.div>
                    )}

                    {reward.gems && reward.gems !== 0 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 20,
                          delay: 0.6,
                        }}
                        className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-full border border-blue-500/40"
                      >
                        <Gem className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-bold text-blue-100">
                          {reward.gems > 0 ? "+" : ""}{reward.gems}
                        </span>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Progress bar animation */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 4, ease: "linear" }}
              className={cn(
                "absolute bottom-0 left-0 h-1 origin-left",
                `bg-gradient-to-r ${config.color}`
              )}
              style={{ width: "100%" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
