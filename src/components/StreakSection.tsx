import { useState } from "react";
import useSWR from "swr";
import { PlayerStats, StreakMultiplier } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flame, Trophy, ChevronDown, ChevronUp } from "lucide-react";

interface StreakSectionProps {
  stats: PlayerStats;
}

export default function StreakSection({ stats }: StreakSectionProps) {
  const { data: streakMultipliers } = useSWR<StreakMultiplier[]>(
    "/api/streak-multipliers"
  );
  const [isStreakExpanded, setIsStreakExpanded] = useState(false);

  const { current_streak, streak_multiplier } = stats;

  // Helper function to get streak tier info
  const getStreakTierInfo = (minDays: number, multiplier: number) => {
    const isActive = current_streak >= minDays;
    const isNext =
      !isActive && current_streak >= (minDays - 7 > 0 ? minDays - 7 : 0);

    return {
      isActive,
      isNext,
      daysNeeded: isActive ? 0 : minDays - current_streak,
    };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-amber-500" />
            Streak & Multiplikator
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsStreakExpanded(!isStreakExpanded)}
            className="flex items-center gap-1"
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
              {current_streak}
            </div>
            <p className="text-sm text-muted-foreground">Tage in Folge</p>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                x{streak_multiplier.toFixed(1)}
              </span>
              {streak_multiplier > 1.0 && (
                <Badge variant="secondary" className="bg-amber-500 text-white">
                  Aktiv
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">XP Multiplikator</p>
          </div>
        </div>

        {/* Expanded Streak Multiplier Tiers */}
        {isStreakExpanded && streakMultipliers && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
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
                          ? "border-amber-500 bg-amber-50 dark:bg-amber-950/20"
                          : tierInfo.isNext
                          ? "border-amber-300 bg-amber-25 dark:bg-amber-950/10"
                          : "border-gray-200 bg-gray-50 dark:bg-gray-900/50"
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
                                : "text-gray-400"
                            }`}
                          />
                          <span className="font-semibold">
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
                        <p className="text-sm font-medium">
                          {tier.min_streak_days === 0
                            ? "Standard"
                            : `${tier.min_streak_days}+ Tage`}
                        </p>

                        {!tierInfo.isActive && tierInfo.daysNeeded > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Noch {tierInfo.daysNeeded} Tage
                          </p>
                        )}

                        {tierInfo.isActive && tier.min_streak_days > 0 && (
                          <p className="text-xs text-amber-600 dark:text-amber-400">
                            Seit {current_streak - tier.min_streak_days + 1}{" "}
                            Tagen aktiv
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Tipp:</strong> Halte deine Streak aufrecht, um höhere
                XP-Multiplikatoren zu erhalten! Jede erledigte Aufgabe gibt dir
                mehr Erfahrungspunkte.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
