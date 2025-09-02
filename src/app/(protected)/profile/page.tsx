"use client";

import useSWR from "swr";
import { PlayerStats } from "@/types";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, Gem, Trophy, Calendar, Target, TrendingUp } from "lucide-react";

export default function ProfilePage() {
  const { data: stats, isLoading } = useSWR<PlayerStats>("/api/player-stats");

  if (isLoading || !stats) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Lade Profil...</div>
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
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Mein Profil</h1>
        <p className="text-muted-foreground">
          Verfolge deinen Fortschritt und deine Erfolge
        </p>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Level Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Level</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Level {level}</div>
            <div className="space-y-2 mt-4">
              {!isMaxLevel ? (
                <>
                  <div className="flex justify-between text-xs">
                    <span>Fortschritt</span>
                    <span>
                      {xpEarnedInLevel} / {totalXpForLevel} XP
                    </span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </>
              ) : (
                <Badge variant="secondary">Max Level erreicht!</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* XP Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Erfahrungspunkte
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{xp.toLocaleString()} XP</div>
            <p className="text-xs text-muted-foreground mt-1">
              Gesamt gesammelte Erfahrung
            </p>
          </CardContent>
        </Card>

        {/* Gems Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Edelsteine</CardTitle>
            <Gem className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{gems}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Verfügbare Edelsteine
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Streak Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-amber-500" />
            Streak & Multiplikator
          </CardTitle>
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
                  <Badge
                    variant="secondary"
                    className="bg-amber-500 text-white"
                  >
                    Aktiv
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">XP Multiplikator</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements Section (Placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Erfolge
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Placeholder achievements */}
            <div className="text-center p-4 border rounded-lg">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-sm font-medium">Erste Aufgabe</p>
              <p className="text-xs text-muted-foreground">Erledigt</p>
            </div>
            <div className="text-center p-4 border rounded-lg opacity-50">
              <Flame className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-medium">7-Tage Streak</p>
              <p className="text-xs text-muted-foreground">Gesperrt</p>
            </div>
            <div className="text-center p-4 border rounded-lg opacity-50">
              <Gem className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-medium">100 Edelsteine</p>
              <p className="text-xs text-muted-foreground">Gesperrt</p>
            </div>
            <div className="text-center p-4 border rounded-lg opacity-50">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-medium">Level 10</p>
              <p className="text-xs text-muted-foreground">Gesperrt</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
