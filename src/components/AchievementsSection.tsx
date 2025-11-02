import { mutate as globalMutate } from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";
import { useState } from "react";
import { useReward } from "@/components/RewardProvider";
import { motion } from "framer-motion";
import { useAchievements } from "@/components/UnifiedDataProvider";
import AchievementCard from "@/components/achievements/AchievementCard";
import { GRADIENTS } from "@/lib/constants";

export default function AchievementsSection() {
  const {
    data: achievements,
    isLoading,
    mutate,
  } = useAchievements();
  const [unlockingIds, setUnlockingIds] = useState<Set<number>>(new Set());
  const { showAchievementReward } = useReward();

  const unlockAchievement = async (achievementId: number) => {
    setUnlockingIds((prev) => new Set(prev).add(achievementId));

    try {
      const response = await fetch("/api/achievements/unlock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ achievementId }),
      });

      if (response.ok) {
        const data = await response.json();

        // Show achievement reward notification
        if (data.achievement) {
          showAchievementReward(
            data.achievement.reward_gems,
            data.achievement.title
          );
        }

        // Refresh achievements data
        mutate();
        // Also refresh player stats to update gems in UI
        globalMutate("/api/player-stats");
      } else {
        const error = await response.json();
        console.error("Fehler beim Freischalten:", error);
        console.error("Response status:", response.status);
        console.error("Full response:", response);
      }
    } catch (error) {
      console.error("Fehler beim Freischalten:", error);
    } finally {
      setUnlockingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(achievementId);
        return newSet;
      });
    }
  };

  if (isLoading) {
    return (
      <Card className={`${GRADIENTS.cardBg} ${GRADIENTS.cardBorder} border backdrop-blur-sm`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Target className="h-5 w-5 text-purple-400" />
            Erfolge
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-slate-400">Lade Erfolge...</div>
        </CardContent>
      </Card>
    );
  }

  if (!achievements || achievements.length === 0) {
    return (
      <Card className={`${GRADIENTS.cardBg} ${GRADIENTS.cardBorder} border backdrop-blur-sm`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Target className="h-5 w-5 text-purple-400" />
            Erfolge
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-slate-400">
            Keine Erfolge verfügbar
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={`${GRADIENTS.cardBg} ${GRADIENTS.cardBorder} border backdrop-blur-sm`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Target className="h-5 w-5 text-purple-400" />
            Erfolge
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {achievements.map((achievement, index) => (
              <AchievementCard
                key={achievement.achievement_id}
                achievement={achievement}
                index={index}
                onUnlock={unlockAchievement}
                isUnlocking={unlockingIds.has(achievement.achievement_id)}
              />
            ))}
          </div>

          {/* Summary Stats */}
          <motion.div
            className="mt-6 pt-4 border-t border-slate-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: achievements.length * 0.1 + 0.5,
            }}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.4,
                  delay: achievements.length * 0.1 + 0.7,
                }}
              >
                <div className="text-2xl font-bold text-purple-400">
                  {achievements.filter((a) => a.is_unlocked).length}
                </div>
                <p className="text-xs text-slate-400">Erreicht</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.4,
                  delay: achievements.length * 0.1 + 0.8,
                }}
              >
                <div className="text-2xl font-bold text-white">
                  {achievements.length}
                </div>
                <p className="text-xs text-slate-400">Gesamt</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.4,
                  delay: achievements.length * 0.1 + 0.9,
                }}
              >
                <div className="text-2xl font-bold text-blue-400">
                  {achievements
                    .filter((a) => a.is_unlocked)
                    .reduce((sum, a) => sum + a.reward_gems, 0)}
                </div>
                <p className="text-xs text-slate-400">Edelsteine erhalten</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.4,
                  delay: achievements.length * 0.1 + 1.0,
                }}
              >
                <div className="text-2xl font-bold text-green-400">
                  {Math.round(
                    (achievements.filter((a) => a.is_unlocked).length /
                      achievements.length) *
                      100
                  )}
                  %
                </div>
                <p className="text-xs text-slate-400">Abgeschlossen</p>
              </motion.div>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
