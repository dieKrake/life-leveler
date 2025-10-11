"use client";

import useSWR from "swr";
import { PlayerStats } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Zap, Gem, Flame } from "lucide-react";

export default function PlayerStatsBar() {
  const { data: stats, isLoading } = useSWR<PlayerStats>("/api/player-stats", {
    refreshInterval: 30000, // Refresh every 30 seconds
    revalidateOnFocus: true, // Refresh when user returns to tab
  });

  if (isLoading || !stats) {
    return (
      <div className="flex justify-center w-full bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 border-b border-slate-700/50 px-4 sticky top-16 z-40">
        <div className="container flex items-center justify-center h-12 text-sm text-slate-300">
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
    <div className="flex justify-center w-full bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 border-b border-slate-700/50 px-4 sticky top-16 z-50 backdrop-blur-sm">
      <div className="container flex items-center justify-between h-12 text-sm">
        <div className="flex items-center gap-6">
          {/* Level Badge */}
          <Badge
            variant="outline"
            className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-100 font-bold"
          >
            Level {level}
          </Badge>

          {/* XP Progress */}
          <div className="flex items-center gap-3">
            <div className="flex-1 max-w-xs">
              <div className="flex justify-between text-xs mb-1 text-slate-300">
                <span>XP</span>
                {isMaxLevel ? (
                  <span>Max Level</span>
                ) : (
                  <span>
                    {xpEarnedInLevel} / {totalXpForLevel}
                  </span>
                )}
              </div>
              <div className="relative w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* XP Display */}
          <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-full border border-yellow-500/30">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium text-yellow-100">
              {xp.toLocaleString()}
            </span>
          </div>

          {/* Gems Display */}
          <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full border border-blue-500/30">
            <Gem className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-100">{gems}</span>
          </div>

          {/* Streak Display */}
          <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-full border border-orange-500/30">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-medium text-orange-100">
              {current_streak}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
