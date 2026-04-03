import { forwardRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Zap, CheckCircle2, Gem } from "lucide-react";
import type { Challenge } from "@/types";
import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";

interface ChallengeCardProps {
  challenge: Challenge;
  type: "daily" | "weekly";
  index: number;
}

const ChallengeCard = forwardRef<HTMLDivElement, ChallengeCardProps>(
  ({ challenge, type, index }, ref) => {
    const { t } = useTranslation();
    const progressPercentage = (challenge.progress / challenge.target) * 100;

    return (
      <motion.div
        ref={ref}
        layout
        layoutId={`challenge-card-${challenge.id}`}
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{
          opacity: 0,
          y: -30,
          scale: 0.9,
          transition: { duration: 0.3 },
        }}
        transition={{
          duration: 0.4,
          delay: index * 0.1,
          type: "spring",
          stiffness: 100,
          layout: { duration: 0.3, ease: "easeInOut" },
        }}
        whileHover={{
          scale: 1.02,
          y: -4,
          transition: { duration: 0.2 },
        }}
        className={`relative overflow-hidden h-full flex flex-col justify-center bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-lg p-6 backdrop-blur-sm ${
          challenge.completed ? "border-green-500/50" : ""
        }`}
      >
        <div className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <motion.div
                className={`p-2 rounded-lg ${
                  type === "daily"
                    ? "bg-blue-500/20 border border-blue-500/30"
                    : "bg-purple-500/20 border border-purple-500/30"
                }`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
              >
                {type === "daily" ? (
                  <Clock className="w-5 h-5 text-blue-400" />
                ) : (
                  <Calendar className="w-5 h-5 text-purple-400" />
                )}
              </motion.div>
              <div>
                <motion.h3
                  className="text-lg font-semibold text-white"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 + 0.3 }}
                >
                  {challenge.title}
                </motion.h3>
                <motion.p
                  className="text-sm text-slate-400"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 + 0.4 }}
                >
                  {challenge.description}
                </motion.p>
              </div>
            </div>
            {challenge.completed && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1 + 0.5,
                  type: "spring",
                  stiffness: 200,
                }}
              >
                <CheckCircle2 className="w-6 h-6 text-green-400" />
              </motion.div>
            )}
          </div>
        </div>

        <div className="space-y-4 flex-1 flex flex-col justify-center">
          <div className="space-y-2">
            <motion.div
              className="flex justify-between text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 + 0.5 }}
            >
              <span className="text-slate-300">{t("challenges.progress")}</span>
              <span className="font-medium text-white">
                {challenge.progress}/{challenge.target}
              </span>
            </motion.div>
            <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{
                  duration: 1.2,
                  delay: index * 0.1 + 0.6,
                  ease: "easeOut",
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <motion.div
              className="flex items-center gap-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 + 0.7 }}
            >
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium text-white">
                  {challenge.xp_reward} XP
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Gem className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-white">
                  {challenge.gem_reward} Gems
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 + 0.8 }}
            >
              <Badge
                variant={challenge.claimed ? "default" : "secondary"}
                className={`text-xs ${
                  challenge.claimed
                    ? "bg-green-500/20 text-green-300 border-green-500/30"
                    : challenge.completed
                      ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                      : "bg-slate-700/50 text-slate-300 border-slate-600/50"
                }`}
              >
                {challenge.claimed
                  ? `✓ ${t("challenges.claimed")}`
                  : challenge.completed
                    ? t("challenges.completed")
                    : challenge.time_left}
              </Badge>
            </motion.div>
          </div>
        </div>
      </motion.div>
    );
  },
);

ChallengeCard.displayName = "ChallengeCard";

export default ChallengeCard;
