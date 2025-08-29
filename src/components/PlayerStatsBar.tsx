"use client";

import useSWR from "swr";
import { Progress } from "@/components/ui/progress";

type PlayerStats = {
  xp: number;
  level: number;
  xp_for_current_level: number;
  xp_for_next_level: number | null;
};

export default function PlayerStatsBar() {
  const {
    data: stats,
    isLoading,
    error,
  } = useSWR<PlayerStats>("/api/player-stats");

  if (isLoading) {
    return (
      <div className="w-full bg-muted border-b">
        <div className="container flex items-center h-12 text-sm text-muted-foreground">
          Lade Stats...
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="w-full bg-muted border-b">
        <div className="container flex items-center h-12 text-sm text-destructive">
          Fehler beim Laden der Stats.
        </div>
      </div>
    );
  }

  const { level, xp, xp_for_current_level, xp_for_next_level } = stats;

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
    <div className="w-full bg-muted border-b">
      <div className="container flex items-center h-12 text-sm text-muted-foreground">
        <div className="flex items-center gap-6 w-full">
          <span className="font-bold">Level {level}</span>
          <div className="flex-1 max-w-xs">
            <div className="flex justify-between text-xs mb-1">
              <span>XP</span>
              {isMaxLevel ? (
                <span>Max Level</span>
              ) : (
                <span>
                  {xpEarnedInLevel} / {totalXpForLevel}
                </span>
              )}
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
          <span className="text-xs">(Gesamt-XP: {xp})</span>
        </div>
      </div>
    </div>
  );
}
