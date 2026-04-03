"use client";

import { PlayerStats } from "@/types";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gem, Trophy, TrendingUp } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface StatsCardsProps {
  stats: PlayerStats;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const { t } = useTranslation();
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Level Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t("common.level")}
          </CardTitle>
          <Trophy className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {t("common.level")} {level}
          </div>
          <div className="space-y-2 mt-4">
            {!isMaxLevel ? (
              <>
                <div className="flex justify-between text-xs">
                  <span>{t("profile.levelProgress")}</span>
                  <span>
                    {xpEarnedInLevel} / {totalXpForLevel} XP
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </>
            ) : (
              <Badge variant="secondary">{t("profile.maxLevelReached")}</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* XP Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t("profile.xpPoints")}
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{xp.toLocaleString()} XP</div>
          <p className="text-xs text-muted-foreground mt-1">
            {t("profile.totalXpCollected")}
          </p>
        </CardContent>
      </Card>

      {/* Gems Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t("common.gems")}
          </CardTitle>
          <Gem className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-500">{gems}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {t("profile.availableGems")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
