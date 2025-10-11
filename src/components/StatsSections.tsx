import { BarChart3, TrendingUp, Calendar, Clock, Trophy } from "lucide-react";
import {
  SimpleBarChart,
  WeeklyBarChart,
  BarChart,
  PieChart,
} from "./StatsCharts";
import type { TodoStats } from "@/types";

interface StatsSectionProps {
  stats: TodoStats;
}

export function DailyCompletionsSection({ stats }: StatsSectionProps) {
  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-lg p-6 backdrop-blur-sm">
      <div className="mb-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
          <Calendar className="h-5 w-5 text-blue-400" />
          Diese Woche
        </h3>
        <p className="text-sm text-slate-400">
          Tägliche Todo-Erledigungen vs. Ziel
        </p>
      </div>
      <SimpleBarChart
        data={stats.dailyCompletions}
        title="Todos pro Tag"
        color="bg-blue-500"
      />
    </div>
  );
}

export function WeeklyTrendSection({ stats }: StatsSectionProps) {
  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-lg p-6 backdrop-blur-sm">
      <div className="mb-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
          <TrendingUp className="h-5 w-5 text-green-400" />
          Wöchentlicher Trend
        </h3>
        <p className="text-sm text-slate-400">
          Todo-Erledigungen der letzten 5 Wochen
        </p>
      </div>
      <WeeklyBarChart
        data={stats.weeklyTrend}
        title="Todos pro Woche"
        color="bg-green-500"
      />
    </div>
  );
}

export function DifficultyDistributionSection({ stats }: StatsSectionProps) {
  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-lg p-6 backdrop-blur-sm">
      <div className="mb-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
          <BarChart3 className="h-5 w-5 text-orange-400" />
          Schwierigkeitsverteilung
        </h3>
        <p className="text-sm text-slate-400">
          Verteilung nach Todo-Schwierigkeit
        </p>
      </div>
      <PieChart
        data={stats.difficultyDistribution}
        title="Nach Schwierigkeit"
      />
    </div>
  );
}

export function HourlyActivitySection({ stats }: StatsSectionProps) {
  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-lg p-6 backdrop-blur-sm">
      <div className="mb-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
          <Clock className="h-5 w-5 text-purple-400" />
          Tagesaktivität
        </h3>
        <p className="text-sm text-slate-400">Produktivste Tageszeiten</p>
      </div>
      <BarChart
        data={stats.hourlyActivity}
        title="Todos pro Stunde"
        color="bg-purple-500"
      />
      <div className="mt-4 p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-400" />
          <span className="text-sm font-medium text-white">
            Produktivste Zeit: {stats.productiveHour} Uhr
          </span>
        </div>
      </div>
    </div>
  );
}
