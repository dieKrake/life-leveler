"use client";

import useSWR from "swr";
import type { TodoStats } from "@/types";
import { StatsKeyMetrics } from "@/components/StatsKeyMetrics";
import {
  DailyCompletionsSection,
  WeeklyTrendSection,
  DifficultyDistributionSection,
  HourlyActivitySection,
} from "@/components/StatsSections";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function StatsPage() {
  const {
    data: stats,
    error,
    isLoading,
  } = useSWR<TodoStats>("/api/todo-stats", fetcher);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="container mx-auto max-w-6xl">
          <div className="space-y-2 flex flex-col items-center">
            <p className="text-slate-300">Lade Statistiken...</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-24 bg-slate-800/50 rounded-lg animate-pulse border border-slate-700/50"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="container mx-auto max-w-6xl">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white">Statistiken</h1>
            <p className="text-red-400">
              Fehler beim Laden der Statistiken: {error.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="container mx-auto max-w-6xl">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white">Statistiken</h1>
            <p className="text-slate-300">Keine Daten verfügbar</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="container mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white">Statistiken</h1>
          <p className="text-slate-300 text-lg">
            Verfolge deinen Fortschritt und deine Produktivität
          </p>
        </div>

        {/* Key Metrics */}
        <StatsKeyMetrics stats={stats} />

        {/* Charts Section */}
        <div className="grid gap-6 md:grid-cols-2">
          <DailyCompletionsSection stats={stats} />
          <WeeklyTrendSection stats={stats} />
          <DifficultyDistributionSection stats={stats} />
          <HourlyActivitySection stats={stats} />
        </div>
      </div>
    </div>
  );
}
