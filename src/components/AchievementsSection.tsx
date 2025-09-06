import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, Trophy, Flame, Gem, TrendingUp } from "lucide-react";
import { UserAchievement } from "@/types";

const iconMap = {
  Trophy,
  Flame,
  Gem,
  TrendingUp,
  Target,
};

export default function AchievementsSection() {
  const { data: achievements, isLoading } =
    useSWR<UserAchievement[]>("/api/achievements");

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Erfolge
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            Lade Erfolge...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!achievements || achievements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Erfolge
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            Keine Erfolge verfügbar
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
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
                    ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20"
                    : "border-gray-200 bg-gray-50 dark:bg-gray-900/50"
                } ${!isUnlocked ? "opacity-75" : ""}`}
              >
                {/* Achievement Icon and Status */}
                <div className="flex items-center justify-between mb-3">
                  <IconComponent
                    className={`h-8 w-8 ${
                      isUnlocked ? "text-yellow-500" : "text-gray-400"
                    }`}
                  />
                  {isUnlocked && (
                    <Badge
                      variant="secondary"
                      className="bg-yellow-500 text-white text-xs"
                    >
                      Erreicht
                    </Badge>
                  )}
                  {achievement.reward_gems > 0 && !isUnlocked && (
                    <Badge variant="outline" className="text-xs">
                      +{achievement.reward_gems} 💎
                    </Badge>
                  )}
                </div>

                {/* Achievement Info */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">{achievement.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {achievement.description}
                  </p>

                  {/* Progress Bar for non-unlocked achievements */}
                  {!isUnlocked && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Fortschritt</span>
                        <span>
                          {achievement.current_progress} /{" "}
                          {achievement.condition_value}
                        </span>
                      </div>
                      <Progress value={progressPercentage} className="h-1.5" />
                      <p className="text-xs text-muted-foreground">
                        {progressPercentage.toFixed(0)}% erreicht
                      </p>
                    </div>
                  )}

                  {/* Unlock date for completed achievements */}
                  {isUnlocked && achievement.unlocked_at && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                      Erreicht am{" "}
                      {new Date(achievement.unlocked_at).toLocaleDateString(
                        "de-DE"
                      )}
                    </p>
                  )}
                </div>

                {/* Reward gems display for unlocked achievements */}
                {isUnlocked && achievement.reward_gems > 0 && (
                  <div className="absolute top-2 right-2">
                    <Badge
                      variant="secondary"
                      className="bg-blue-500 text-white text-xs"
                    >
                      +{achievement.reward_gems} 💎
                    </Badge>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-yellow-500">
                {achievements.filter((a) => a.is_unlocked).length}
              </div>
              <p className="text-xs text-muted-foreground">Erreicht</p>
            </div>
            <div>
              <div className="text-2xl font-bold">{achievements.length}</div>
              <p className="text-xs text-muted-foreground">Gesamt</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-500">
                {achievements
                  .filter((a) => a.is_unlocked)
                  .reduce((sum, a) => sum + a.reward_gems, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Edelsteine erhalten
              </p>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-500">
                {Math.round(
                  (achievements.filter((a) => a.is_unlocked).length /
                    achievements.length) *
                    100
                )}
                %
              </div>
              <p className="text-xs text-muted-foreground">Abgeschlossen</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
