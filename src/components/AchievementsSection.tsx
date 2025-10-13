import useSWR, { mutate as globalMutate } from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, Trophy, Flame, Gem, TrendingUp, Unlock } from "lucide-react";
import { UserAchievement } from "@/types";
import { useState } from "react";
import { useReward } from "@/components/RewardProvider";

const iconMap = {
  Trophy,
  Flame,
  Gem,
  TrendingUp,
  Target,
};

export default function AchievementsSection() {
  const {
    data: achievements,
    isLoading,
    mutate,
  } = useSWR<UserAchievement[]>("/api/achievements");
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
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm">
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
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm">
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
    <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Target className="h-5 w-5 text-purple-400" />
          Erfolge
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {achievements.map((achievement) => {
            const IconComponent =
              iconMap[achievement.icon as keyof typeof iconMap] || Target;
            const isUnlocked = achievement.is_unlocked;
            const progressPercentage = Math.min(
              achievement.progress_percentage,
              100
            );

            return (
              <div
                key={achievement.achievement_id}
                className={`relative p-4 border rounded-lg transition-all ${
                  isUnlocked
                    ? "border-purple-400 bg-amber-950/20"
                    : "border-slate-700 bg-slate-800/50"
                } ${!isUnlocked ? "opacity-75" : ""}`}
              >
                {/* Achievement Icon and Status */}
                <div className="flex items-center justify-between mb-3">
                  <IconComponent
                    className={`h-8 w-8 ${
                      isUnlocked ? "text-purple-400" : "text-slate-500"
                    }`}
                  />
                  {isUnlocked && (
                    <Badge
                      variant="secondary"
                      className="bg-purple-600 text-white text-xs"
                    >
                      Erreicht
                    </Badge>
                  )}
                  {achievement.reward_gems > 0 && !isUnlocked && (
                    <Badge
                      variant="outline"
                      className="text-xs border-slate-600 text-slate-300"
                    >
                      <div className="flex items-center gap-1">
                        +{achievement.reward_gems} <Gem className="h-3 w-3" />
                      </div>
                    </Badge>
                  )}
                </div>

                {/* Achievement Info */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-white">
                    {achievement.name}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {achievement.description}
                  </p>

                  {/* Progress Bar for non-unlocked achievements */}
                  {!isUnlocked && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Fortschritt</span>
                        <span>
                          {achievement.current_progress} /{" "}
                          {achievement.condition_value}
                        </span>
                      </div>
                      <div className="relative w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all duration-300"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-400">
                        {progressPercentage.toFixed(0)}% erreicht
                      </p>

                      {/* Unlock button if achievement is completed but not unlocked */}
                      {achievement.current_progress >=
                        achievement.condition_value && (
                        <Button
                          size="sm"
                          onClick={() =>
                            unlockAchievement(achievement.achievement_id)
                          }
                          disabled={unlockingIds.has(
                            achievement.achievement_id
                          )}
                          className="w-full mt-2"
                        >
                          <Unlock className="h-3 w-3 mr-1" />
                          {unlockingIds.has(achievement.achievement_id)
                            ? "Schalte frei..."
                            : "Freischalten"}
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Unlock date for completed achievements */}
                  {isUnlocked && achievement.unlocked_at && (
                    <p className="text-xs text-purple-400">
                      Erreicht am{" "}
                      {new Date(achievement.unlocked_at).toLocaleDateString(
                        "de-DE"
                      )}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 pt-4 border-t border-slate-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-purple-400">
                {achievements.filter((a) => a.is_unlocked).length}
              </div>
              <p className="text-xs text-slate-400">Erreicht</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {achievements.length}
              </div>
              <p className="text-xs text-slate-400">Gesamt</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">
                {achievements
                  .filter((a) => a.is_unlocked)
                  .reduce((sum, a) => sum + a.reward_gems, 0)}
              </div>
              <p className="text-xs text-slate-400">Edelsteine erhalten</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">
                {Math.round(
                  (achievements.filter((a) => a.is_unlocked).length /
                    achievements.length) *
                    100
                )}
                %
              </div>
              <p className="text-xs text-slate-400">Abgeschlossen</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
