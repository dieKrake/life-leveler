"use client";

import { Target, CheckCircle2, Clock, BarChart3 } from "lucide-react";
import type { TodoStats } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";

interface StatsKeyMetricsProps {
  stats: TodoStats;
}

export function StatsKeyMetrics({ stats }: StatsKeyMetricsProps) {
  const { t } = useTranslation();
  return (
    <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-lg p-6 backdrop-blur-sm">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium text-slate-300">
            {t("stats.totalTodos")}
          </h3>
          <Target className="h-4 w-4 text-purple-400" />
        </div>
        <div className="text-2xl font-bold text-white">{stats.totalTodos}</div>
        <p className="text-xs text-slate-400">
          {stats.completedTodos} {t("dashboard.completed")}
        </p>
      </div>

      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-lg p-6 backdrop-blur-sm">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium text-slate-300">
            Completion Rate
          </h3>
          <CheckCircle2 className="h-4 w-4 text-green-400" />
        </div>
        <div className="text-2xl font-bold text-white">
          {stats.totalTodos > 0
            ? ((stats.completedTodos / stats.totalTodos) * 100).toFixed(1)
            : "0"}
          %
        </div>
        <p className="text-xs text-slate-400">
          {stats.completedTodos} / {stats.totalTodos} Todos
        </p>
      </div>

      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-lg p-6 backdrop-blur-sm">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium text-slate-300">
            {t("stats.mostProductiveTime")}
          </h3>
          <Clock className="h-4 w-4 text-blue-400" />
        </div>
        <div className="text-2xl font-bold text-white">
          {stats.productiveHour}
        </div>
        <p className="text-xs text-slate-400">{t("stats.bestTimeOfDay")}</p>
      </div>

      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-lg p-6 backdrop-blur-sm">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium text-slate-300">
            {t("stats.highestStreak")}
          </h3>
          <BarChart3 className="h-4 w-4 text-orange-400" />
        </div>
        <div className="text-2xl font-bold text-white">
          {stats.highestStreak}
        </div>
        <p className="text-xs text-slate-400">
          {t("stats.currentStreak")}: {stats.currentStreak}
        </p>
      </div>
    </section>
  );
}
