import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";
import { motion } from "framer-motion";
import { useAchievements } from "@/components/UnifiedDataProvider";
import AchievementCard from "@/components/achievements/AchievementCard";
import { GRADIENTS } from "@/lib/constants";
import { useTranslation } from "@/hooks/useTranslation";

export default function AchievementsSection() {
  const { data: achievements, isLoading } = useAchievements();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <Card
        className={`${GRADIENTS.cardBg} ${GRADIENTS.cardBorder} border backdrop-blur-sm`}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Target className="h-5 w-5 text-purple-400" />
            {t("achievements.achievements")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-slate-400">
            {t("achievements.loadingAchievements")}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!achievements || achievements.length === 0) {
    return (
      <Card
        className={`${GRADIENTS.cardBg} ${GRADIENTS.cardBorder} border backdrop-blur-sm`}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Target className="h-5 w-5 text-purple-400" />
            {t("achievements.achievements")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-slate-400">
            {t("achievements.noAchievements")}
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
      <Card
        className={`${GRADIENTS.cardBg} ${GRADIENTS.cardBorder} border backdrop-blur-sm`}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Target className="h-5 w-5 text-purple-400" />
            {t("achievements.achievements")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {achievements.map((achievement, index) => (
              <AchievementCard
                key={achievement.achievement_id}
                achievement={achievement}
                index={index}
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
                <p className="text-xs text-slate-400">
                  {t("achievements.achieved")}
                </p>
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
                <p className="text-xs text-slate-400">
                  {t("achievements.total")}
                </p>
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
                <p className="text-xs text-slate-400">
                  {t("achievements.gemsEarned")}
                </p>
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
                      100,
                  )}
                  %
                </div>
                <p className="text-xs text-slate-400">
                  {t("achievements.percentCompleted")}
                </p>
              </motion.div>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
