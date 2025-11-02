import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Unlock, Gem } from "lucide-react";
import { UserAchievement } from "@/types";
import { ICON_MAP } from "@/lib/constants";
import ProgressBar from "@/components/common/ProgressBar";

interface AchievementCardProps {
  achievement: UserAchievement;
  index: number;
  onUnlock: (achievementId: number) => void;
  isUnlocking: boolean;
}

export default function AchievementCard({
  achievement,
  index,
  onUnlock,
  isUnlocking,
}: AchievementCardProps) {
  const IconComponent = ICON_MAP[achievement.icon as keyof typeof ICON_MAP] || ICON_MAP.Target;
  const isUnlocked = achievement.is_unlocked;
  const canUnlock = achievement.current_progress >= achievement.condition_value;

  return (
    <motion.div
      key={achievement.achievement_id}
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: index * 0.1,
        type: "spring",
        stiffness: 100,
      }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`relative p-4 border rounded-lg transition-all ${
        isUnlocked
          ? "border-purple-400 bg-amber-950/20"
          : "border-slate-700 bg-slate-800/50"
      } ${!isUnlocked ? "opacity-75" : ""}`}
    >
      {/* Achievement Icon and Status */}
      <div className="flex items-center justify-between mb-3">
        <IconComponent
          className={`h-8 w-8 ${isUnlocked ? "text-purple-400" : "text-slate-500"}`}
        />
        {isUnlocked && (
          <Badge variant="secondary" className="bg-purple-600 text-white text-xs">
            Erreicht
          </Badge>
        )}
        {achievement.reward_gems > 0 && !isUnlocked && (
          <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
            <div className="flex items-center gap-1">
              +{achievement.reward_gems} <Gem className="h-3 w-3" />
            </div>
          </Badge>
        )}
      </div>

      {/* Achievement Info */}
      <div className="space-y-2">
        <h4 className="font-medium text-sm text-white">{achievement.name}</h4>
        <p className="text-xs text-slate-400">{achievement.description}</p>

        {/* Progress for non-unlocked achievements */}
        {!isUnlocked && (
          <div className="space-y-1">
            <ProgressBar
              progress={achievement.current_progress}
              total={achievement.condition_value}
              showLabel={true}
              gradient="achievementProgress"
              height="sm"
              delay={index * 0.1 + 0.5}
            />
            <p className="text-xs text-slate-400">
              {Math.min(achievement.progress_percentage, 100).toFixed(0)}% erreicht
            </p>

            {/* Unlock button if completed but not unlocked */}
            {canUnlock && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.1 + 0.8,
                  type: "spring",
                  stiffness: 200,
                }}
              >
                <motion.div
                  animate={{
                    scale: [1, 1.05, 1],
                    boxShadow: [
                      "0 0 0px rgba(168, 85, 247, 0)",
                      "0 0 20px rgba(168, 85, 247, 0.4)",
                      "0 0 0px rgba(168, 85, 247, 0)",
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "loop",
                  }}
                >
                  <Button
                    size="sm"
                    onClick={() => onUnlock(achievement.achievement_id)}
                    disabled={isUnlocking}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    <Unlock className="h-3 w-3 mr-1" />
                    {isUnlocking ? "Schalte frei..." : "Freischalten"}
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </div>
        )}

        {/* Unlock date for completed achievements */}
        {isUnlocked && achievement.unlocked_at && (
          <p className="text-xs text-purple-400">
            Erreicht am{" "}
            {new Date(achievement.unlocked_at).toLocaleDateString("de-DE")}
          </p>
        )}
      </div>
    </motion.div>
  );
}
