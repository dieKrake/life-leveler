"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Clock,
  Target,
  Zap,
  Trophy,
  Activity,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import useSWR from "swr";
import type { TodoStats } from "@/types";

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
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2 mb-2" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
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

  const BarChart = ({
    data,
    title,
    color = "bg-blue-500",
  }: {
    data: any[];
    title: string;
    color?: string;
  }) => {
    const maxValue = Math.max(
      ...data.map((d) => d.completed || d.todos || d.count),
      1 // Ensure maxValue is at least 1 to avoid division by zero
    );

    return (
      <div className="space-y-3">
        <h4 className="font-medium text-sm">{title}</h4>
        <div className="flex items-end justify-between h-32 gap-2">
          {data.map((item, index) => (
            <div
              key={index}
              className="flex flex-col items-center gap-1 flex-1"
            >
              <div
                className="relative w-full bg-muted rounded-sm overflow-hidden"
                style={{ height: "80px" }}
              >
                <div
                  className={`${color} rounded-sm transition-all duration-500 ease-out`}
                  style={{
                    height: `${
                      ((item.completed || item.todos || item.count) /
                        maxValue) *
                      100
                    }%`,
                    marginTop: "auto",
                  }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {item.day || item.week || item.hour}
              </span>
              <span className="text-xs font-medium">
                {item.completed || item.todos || item.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const SimpleBarChart = ({
    data,
    title,
    color = "bg-blue-500",
  }: {
    data: any[];
    title: string;
    color?: string;
  }) => {
    const values = data.map((d) => d.completed || d.todos || d.count || 0);
    const maxValue = Math.max(...values, 1);

    return (
      <div className="space-y-4">
        <h4 className="font-medium text-sm">{title}</h4>
        <div className="grid grid-cols-7 gap-2 h-32">
          {data.map((item, index) => {
            const value = values[index];
            const height =
              maxValue > 0 ? Math.round((value / maxValue) * 100) : 0;

            return (
              <div
                key={index}
                className="flex flex-col items-center justify-end space-y-1"
              >
                <div className="w-full h-24 bg-gray-100 rounded flex items-end justify-center relative">
                  <div
                    className={`${color} w-full rounded transition-all duration-300`}
                    style={{
                      height: value > 0 ? `${Math.max(height, 8)}%` : "0%",
                    }}
                  />
                </div>
                <div className="text-xs text-center">
                  <div className="text-muted-foreground">
                    {item.day || item.week || item.hour}
                  </div>
                  <div className="font-medium">{value}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const WeeklyBarChart = ({
    data,
    title,
    color = "bg-green-500",
  }: {
    data: any[];
    title: string;
    color?: string;
  }) => {
    const values = data.map((d) => d.todos || d.completed || d.count || 0);
    const maxValue = Math.max(...values, 1);

    return (
      <div className="space-y-4">
        <h4 className="font-medium text-sm">{title}</h4>
        <div className="grid grid-cols-5 gap-3 h-32">
          {data.map((item, index) => {
            const value = values[index];
            const height =
              maxValue > 0 ? Math.round((value / maxValue) * 100) : 0;

            return (
              <div
                key={index}
                className="flex flex-col items-center justify-end space-y-1"
              >
                <div className="w-full h-24 bg-gray-100 rounded flex items-end justify-center relative">
                  <div
                    className={`${color} w-full rounded transition-all duration-300`}
                    style={{
                      height: value > 0 ? `${Math.max(height, 8)}%` : "0%",
                    }}
                  />
                </div>
                <div className="text-xs text-center">
                  <div className="text-muted-foreground">{item.week}</div>
                  <div className="font-medium">{value}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const PieChart = ({ data, title }: { data: any[]; title: string }) => {
    const total = data.reduce((sum, item) => sum + item.count, 0);

    return (
      <div className="space-y-4">
        <h4 className="font-medium text-sm">{title}</h4>
        <div className="space-y-3">
          {data.map((item, index) => {
            const percentage = (item.count / total) * 100;
            return (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="text-sm">{item.difficulty}</span>
                  </div>
                  <span className="text-sm font-medium">{item.count}</span>
                </div>
                <Progress value={percentage} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  {percentage.toFixed(1)}% • {item.xp} XP pro Todo
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Statistiken</h1>
        <p className="text-muted-foreground">
          Verfolge deinen Fortschritt und analysiere deine Produktivität
        </p>
      </div>

      {/* Key Metrics */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamt Todos</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTodos}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedTodos} abgeschlossen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Aktueller Streak
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.currentStreak} Tage</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedTodosWithTimestamps} mit Timestamps
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamt XP</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalXP.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalGems} Gems gesammelt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completion Rate
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalTodos > 0
                ? ((stats.completedTodos / stats.totalTodos) * 100).toFixed(1)
                : "0"}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              Produktivste Zeit: {stats.productiveHour}
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Daily Completions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Diese Woche
            </CardTitle>
            <CardDescription>
              Tägliche Todo-Erledigungen vs. Ziel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleBarChart
              data={stats.dailyCompletions}
              title="Todos pro Tag"
              color="bg-blue-500"
            />
          </CardContent>
        </Card>

        {/* Weekly Trend */}
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

        {/* Difficulty Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Schwierigkeitsverteilung
            </CardTitle>
            <CardDescription>
              Verteilung nach Todo-Schwierigkeit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PieChart
              data={stats.difficultyDistribution}
              title="Nach Schwierigkeit"
            />
          </CardContent>
        </Card>

        {/* Hourly Activity */}
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
      </div>
    </div>
  );
}
