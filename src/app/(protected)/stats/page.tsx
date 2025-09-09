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
      <div className="container mx-auto p-6 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Statistiken</h1>
          <p className="text-muted-foreground">Lade Statistiken...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Statistiken</h1>
          <p className="text-red-500">
            Fehler beim Laden der Statistiken: {error.message}
          </p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto p-6 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Statistiken</h1>
          <p className="text-muted-foreground">Keine Daten verfügbar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
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
  );
}
