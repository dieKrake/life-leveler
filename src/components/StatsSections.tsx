import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Diese Woche
        </CardTitle>
        <CardDescription>Tägliche Todo-Erledigungen vs. Ziel</CardDescription>
      </CardHeader>
      <CardContent>
        <SimpleBarChart
          data={stats.dailyCompletions}
          title="Todos pro Tag"
          color="bg-blue-500"
        />
      </CardContent>
    </Card>
  );
}

export function WeeklyTrendSection({ stats }: StatsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Wöchentlicher Trend
        </CardTitle>
        <CardDescription>
          Todo-Erledigungen der letzten 5 Wochen
        </CardDescription>
      </CardHeader>
      <CardContent>
        <WeeklyBarChart
          data={stats.weeklyTrend}
          title="Todos pro Woche"
          color="bg-green-500"
        />
      </CardContent>
    </Card>
  );
}

export function DifficultyDistributionSection({ stats }: StatsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Schwierigkeitsverteilung
        </CardTitle>
        <CardDescription>Verteilung nach Todo-Schwierigkeit</CardDescription>
      </CardHeader>
      <CardContent>
        <PieChart
          data={stats.difficultyDistribution}
          title="Nach Schwierigkeit"
        />
      </CardContent>
    </Card>
  );
}

export function HourlyActivitySection({ stats }: StatsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Tagesaktivität
        </CardTitle>
        <CardDescription>Produktivste Tageszeiten</CardDescription>
      </CardHeader>
      <CardContent>
        <BarChart
          data={stats.hourlyActivity}
          title="Todos pro Stunde"
          color="bg-purple-500"
        />
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">
              Produktivste Zeit: {stats.productiveHour} Uhr
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
