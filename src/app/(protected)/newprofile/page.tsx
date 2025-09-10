"use client";

import { useState } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import { PlayerStats, UserAchievement, StreakMultiplier } from "@/types";
import ProfilePicture from "@/components/ProfilePicture";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Target,
  Flame,
  Gem,
  TrendingUp,
  Unlock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const iconMap = {
  Trophy,
  Flame,
  Gem,
  TrendingUp,
  Target,
};

export default function NewProfilePage() {
  const { data: stats, isLoading: statsLoading } =
    useSWR<PlayerStats>("/api/player-stats");
  const {
    data: achievements,
    isLoading: achievementsLoading,
    mutate,
  } = useSWR<UserAchievement[]>("/api/achievements");
  const { data: streakMultipliers } = useSWR<StreakMultiplier[]>(
    "/api/streak-multipliers"
  );

  const [unlockingIds, setUnlockingIds] = useState<Set<number>>(new Set());
  const [isStreakExpanded, setIsStreakExpanded] = useState(false);

  if (statsLoading || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center text-white">Lade Profil...</div>
        </div>
      </div>
    );
  }

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
        mutate();
        globalMutate("/api/player-stats");
      } else {
        const error = await response.json();
        console.error("Fehler beim Freischalten:", error);
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

  const getStreakTierInfo = (minDays: number, multiplier: number) => {
    const isActive = stats.current_streak >= minDays;
    const isNext =
      !isActive && stats.current_streak >= (minDays - 7 > 0 ? minDays - 7 : 0);

    return {
      isActive,
      isNext,
      daysNeeded: isActive ? 0 : minDays - stats.current_streak,
    };
  };

  // Calculate level progress
  const { level, xp, xp_for_current_level, xp_for_next_level, gems } = stats;
  const isMaxLevel = xp_for_next_level === null;
  let xpEarnedInLevel = 0;
  let totalXpForLevel = 1;
  let progressPercentage = 100;

  if (!isMaxLevel) {
    xpEarnedInLevel = xp - xp_for_current_level;
    totalXpForLevel = xp_for_next_level - xp_for_current_level;
    progressPercentage =
      totalXpForLevel > 0 ? (xpEarnedInLevel / totalXpForLevel) * 100 : 0;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="container mx-auto max-w-6xl space-y-8">
        {/* Profile Header with ProfilePicture */}
        <div className="text-center space-y-6">
          <ProfilePicture
            user={{ name: "Max Mustermann" }}
            level={level}
            xp={xp}
            xpForCurrentLevel={xp_for_current_level}
            xpForNextLevel={xp_for_next_level || xp_for_current_level}
            gems={gems}
            streak={stats.current_streak}
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Level Card */}
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                Level
              </CardTitle>
              <Trophy className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">Level {level}</div>
              <div className="space-y-2 mt-4">
                {!isMaxLevel ? (
                  <>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Fortschritt</span>
                      <span>
                        {xpEarnedInLevel} / {totalXpForLevel} XP
                      </span>
                    </div>
                    <Progress
                      value={progressPercentage}
                      className="h-2 bg-slate-700"
                    />
                  </>
                ) : (
                  <Badge
                    variant="secondary"
                    className="bg-yellow-500 text-white"
                  >
                    Max Level erreicht!
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* XP Card */}
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                Erfahrungspunkte
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {xp.toLocaleString()} XP
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Gesamt gesammelte Erfahrung
              </p>
            </CardContent>
          </Card>

          {/* Gems Card */}
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                Edelsteine
              </CardTitle>
              <Gem className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">{gems}</div>
              <p className="text-xs text-slate-400 mt-1">
                Verfügbare Edelsteine
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Streak Section */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-white">
                <Flame className="h-5 w-5 text-amber-500" />
                Streak & Multiplikator
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsStreakExpanded(!isStreakExpanded)}
                className="flex items-center gap-1 text-slate-300 hover:text-white"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-3xl font-bold text-amber-500">
                  {stats.current_streak}
                </div>
                <p className="text-sm text-slate-400">Tage in Folge</p>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-white">
                    x{stats.streak_multiplier.toFixed(1)}
                  </span>
                  {stats.streak_multiplier > 1.0 && (
                    <Badge
                      variant="secondary"
                      className="bg-amber-500 text-white"
                    >
                      Aktiv
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-400">XP Multiplikator</p>
              </div>
            </div>

            {/* Expanded Streak Multiplier Tiers */}
            {isStreakExpanded && streakMultipliers && (
              <div className="mt-6 pt-6 border-t border-slate-700">
                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Streak Multiplikator Stufen
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {streakMultipliers
                    .sort((a, b) => a.min_streak_days - b.min_streak_days)
                    .map((tier) => {
                      const tierInfo = getStreakTierInfo(
                        tier.min_streak_days,
                        tier.multiplier
                      );

                      return (
                        <div
                          key={tier.id}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            tierInfo.isActive
                              ? "border-amber-500 bg-amber-950/20"
                              : tierInfo.isNext
                              ? "border-amber-300 bg-amber-950/10"
                              : "border-slate-700 bg-slate-800/50"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Flame
                                className={`h-5 w-5 ${
                                  tierInfo.isActive
                                    ? "text-amber-500"
                                    : tierInfo.isNext
                                    ? "text-amber-400"
                                    : "text-slate-500"
                                }`}
                              />
                              <span className="font-semibold text-white">
                                x{tier.multiplier.toFixed(1)}
                              </span>
                            </div>
                            {tierInfo.isActive && (
                              <Badge
                                variant="secondary"
                                className="bg-amber-500 text-white text-xs"
                              >
                                Erreicht
                              </Badge>
                            )}
                          </div>

                          <div className="space-y-1">
                            <p className="text-sm font-medium text-white">
                              {tier.min_streak_days === 0
                                ? "Standard"
                                : `${tier.min_streak_days}+ Tage`}
                            </p>

                            {!tierInfo.isActive && tierInfo.daysNeeded > 0 && (
                              <p className="text-xs text-slate-400">
                                Noch {tierInfo.daysNeeded} Tage
                              </p>
                            )}

                            {tierInfo.isActive && tier.min_streak_days > 0 && (
                              <p className="text-xs text-amber-400">
                                Seit{" "}
                                {stats.current_streak -
                                  tier.min_streak_days +
                                  1}{" "}
                                Tagen aktiv
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>

                <div className="mt-4 p-3 bg-blue-950/20 rounded-lg border border-blue-800">
                  <p className="text-sm text-blue-300">
                    <strong>Tipp:</strong> Halte deine Streak aufrecht, um
                    höhere XP-Multiplikatoren zu erhalten! Jede erledigte
                    Aufgabe gibt dir mehr Erfahrungspunkte.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Achievements Section */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Target className="h-5 w-5 text-purple-400" />
              Erfolge
            </CardTitle>
          </CardHeader>
          <CardContent>
            {achievementsLoading ? (
              <div className="text-center text-slate-400">Lade Erfolge...</div>
            ) : !achievements || achievements.length === 0 ? (
              <div className="text-center text-slate-400">
                Keine Erfolge verfügbar
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {achievements.map((achievement) => {
                    const IconComponent =
                      iconMap[achievement.icon as keyof typeof iconMap] ||
                      Target;
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
                            ? "border-yellow-500 bg-yellow-950/20"
                            : "border-slate-700 bg-slate-800/50"
                        } ${!isUnlocked ? "opacity-75" : ""}`}
                      >
                        {/* Achievement Icon and Status */}
                        <div className="flex items-center justify-between mb-3">
                          <IconComponent
                            className={`h-8 w-8 ${
                              isUnlocked ? "text-yellow-500" : "text-slate-500"
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
                            <Badge
                              variant="outline"
                              className="text-xs border-slate-600 text-slate-300"
                            >
                              +{achievement.reward_gems} 💎
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
                              <Progress
                                value={progressPercentage}
                                className="h-1.5 bg-slate-700"
                              />
                              <p className="text-xs text-slate-400">
                                {progressPercentage.toFixed(0)}% erreicht
                              </p>

                              {/* Unlock button if achievement is completed but not unlocked */}
                              {achievement.current_progress >=
                                achievement.condition_value && (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    unlockAchievement(
                                      achievement.achievement_id
                                    )
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
                            <p className="text-xs text-yellow-400">
                              Erreicht am{" "}
                              {new Date(
                                achievement.unlocked_at
                              ).toLocaleDateString("de-DE")}
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
                <div className="mt-6 pt-4 border-t border-slate-700">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-yellow-500">
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
                      <p className="text-xs text-slate-400">
                        Edelsteine erhalten
                      </p>
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
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
