import { Target, CheckCircle2, Clock, BarChart3 } from "lucide-react";
import type { TodoStats } from "@/types";

interface StatsKeyMetricsProps {
  stats: TodoStats;
}

export function StatsKeyMetrics({ stats }: StatsKeyMetricsProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-lg p-6 backdrop-blur-sm">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium text-slate-300">Gesamt Todos</h3>
          <Target className="h-4 w-4 text-purple-400" />
        </div>
        <div className="text-2xl font-bold text-white">{stats.totalTodos}</div>
        <p className="text-xs text-slate-400">
          {stats.completedTodos} abgeschlossen
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
          {stats.completedTodos} von {stats.totalTodos} Todos
        </p>
      </div>

      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-lg p-6 backdrop-blur-sm">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium text-slate-300">
            Produktivste Zeit
          </h3>
          <Clock className="h-4 w-4 text-blue-400" />
        </div>
        <div className="text-2xl font-bold text-white">
          {stats.productiveHour}
        </div>
        <p className="text-xs text-slate-400">Beste Tageszeit</p>
      </div>

      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-lg p-6 backdrop-blur-sm">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium text-slate-300">Highest Streak</h3>
          <BarChart3 className="h-4 w-4 text-orange-400" />
        </div>
        <div className="text-2xl font-bold text-white">
          {stats.highestStreak}
        </div>
        <p className="text-xs text-slate-400">
          Current streak: {stats.currentStreak}
        </p>
      </div>
    </section>
  );
}
