// src/components/PlayerStatsBar.tsx
"use client";

import useSWR from "swr";
import { getXpForNextLevel } from "@/lib/leveling";
import { Progress } from "@/components/ui/progress";

// Typ-Definition für die Stats
type PlayerStats = {
  xp: number;
  level: number;
};

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

  const { level, xp } = stats;
  const xpForNextLevel = getXpForNextLevel(level);
  const progressPercentage = (xp / xpForNextLevel) * 100;

  return (
    <div className="w-full bg-muted border-b">
      <div className="container flex items-center h-12 text-sm text-muted-foreground">
        <div className="flex items-center gap-6 w-full">
          <span className="font-bold">Level {level}</span>
          <div className="flex-1 max-w-xs">
            <div className="flex justify-between text-xs mb-1">
              <span>XP</span>
              <span>
                {xp} / {xpForNextLevel}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>
      </div>
    </div>
  );
}
