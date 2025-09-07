"use client";

import useSWR from "swr";
import { Progress } from "@/components/ui/progress";
import { Flame, Gem } from "lucide-react"; // Gem-Icon importieren
import { PlayerStats } from "@/types";

export default function PlayerStatsBar() {
  const { data: stats, isLoading } = useSWR<PlayerStats>("/api/player-stats");

  if (isLoading || !stats) {
    return (
      <div className="w-full bg-muted border-b">
        <div className="container flex items-center h-12 text-sm text-muted-foreground">
          Lade Stats...
        </div>
      </div>
    );
  }

  const {
    level,
    xp,
    xp_for_current_level,
    xp_for_next_level,
    current_streak,
    streak_multiplier,
    gems,
  } = stats;

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
    <div className="flex justify-center w-full bg-muted border-b px-4 sticky top-14 z-50">
      <div className="container flex items-center justify-between h-12 text-sm text-muted-foreground">
        <div className="flex items-center gap-6">
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
            <Progress value={progressPercentage} className="h-2 w-32" />
          </div>
          <span className="text-xs">(Gesamt-XP: {xp})</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 font-bold text-blue-500">
            <Gem className="h-4 w-4" />
            <span>{gems}</span>
          </div>
          <div className="flex items-center gap-2 font-bold text-amber-500">
            <div className="flex items-center gap-1">
              <Flame className="h-4 w-4" />
              <span>{current_streak}</span>
            </div>
            {streak_multiplier > 1.0 && (
              <span className="text-xs font-semibold bg-amber-500 text-white px-1.5 py-0.5 rounded-full">
                x{streak_multiplier.toFixed(1)} XP
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
