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

export default function StatsPage() {
  // Mock data - später durch echte API-Calls ersetzen
  const mockStats = {
    totalTodos: 156,
    completedTodos: 134,
    currentStreak: 7,
    longestStreak: 12,
    totalXP: 2840,
    totalGems: 89,
    averageCompletionTime: "2.3h",
    productiveHour: "10:00",
  };

  const dailyCompletions = [
    { day: "Mo", completed: 8, target: 5 },
    { day: "Di", completed: 6, target: 5 },
    { day: "Mi", completed: 12, target: 5 },
    { day: "Do", completed: 4, target: 5 },
    { day: "Fr", completed: 9, target: 5 },
    { day: "Sa", completed: 3, target: 5 },
    { day: "So", completed: 7, target: 5 },
  ];

  const weeklyTrend = [
    { week: "KW 32", todos: 28 },
    { week: "KW 33", todos: 35 },
    { week: "KW 34", todos: 42 },
    { week: "KW 35", todos: 38 },
    { week: "KW 36", todos: 49 },
  ];

  const difficultyDistribution = [
    { difficulty: "Easy", count: 45, xp: 10, color: "bg-green-500" },
    { difficulty: "Medium", count: 67, xp: 20, color: "bg-yellow-500" },
    { difficulty: "Hard", count: 22, xp: 30, color: "bg-red-500" },
  ];

  const hourlyActivity = [
    { hour: "6", count: 2 },
    { hour: "7", count: 5 },
    { hour: "8", count: 12 },
    { hour: "9", count: 18 },
    { hour: "10", count: 25 },
    { hour: "11", count: 22 },
    { hour: "12", count: 15 },
    { hour: "13", count: 8 },
    { hour: "14", count: 14 },
    { hour: "15", count: 20 },
    { hour: "16", count: 16 },
    { hour: "17", count: 12 },
    { hour: "18", count: 8 },
    { hour: "19", count: 4 },
    { hour: "20", count: 2 },
  ];

  const maxHourlyCount = Math.max(...hourlyActivity.map((h) => h.count));

  const BarChart = ({
    data,
    title,
    color = "bg-blue-500",
  }: {
    data: any[];
    title: string;
    color?: string;
  }) => (
    <div className="space-y-3">
      <h4 className="font-medium text-sm">{title}</h4>
      <div className="flex items-end justify-between h-32 gap-2">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center gap-1 flex-1">
            <div
              className="relative w-full bg-muted rounded-sm overflow-hidden"
              style={{ height: "80px" }}
            >
              <div
                className={`${color} rounded-sm transition-all duration-500 ease-out`}
                style={{
                  height: `${
                    ((item.completed || item.todos || item.count) /
                      Math.max(
                        ...data.map((d) => d.completed || d.todos || d.count)
                      )) *
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
            <div className="text-2xl font-bold">{mockStats.totalTodos}</div>
            <p className="text-xs text-muted-foreground">
              {mockStats.completedTodos} abgeschlossen
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
            <div className="text-2xl font-bold">
              {mockStats.currentStreak} Tage
            </div>
            <p className="text-xs text-muted-foreground">
              Rekord: {mockStats.longestStreak} Tage
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
              {mockStats.totalXP.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {mockStats.totalGems} Gems gesammelt
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
              {(
                (mockStats.completedTodos / mockStats.totalTodos) *
                100
              ).toFixed(1)}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              Ø {mockStats.averageCompletionTime} pro Todo
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
            <BarChart
              data={dailyCompletions}
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
            <BarChart
              data={weeklyTrend}
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
              data={difficultyDistribution}
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
              data={hourlyActivity}
              title="Todos pro Stunde"
              color="bg-purple-500"
            />
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">
                  Produktivste Zeit: {mockStats.productiveHour} Uhr
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Achievements */}
      <Card>
        <CardHeader>
          <CardTitle>Letzte Erfolge</CardTitle>
          <CardDescription>
            Deine neuesten Meilensteine und Errungenschaften
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <Trophy className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="font-medium text-green-900">
                  7-Tage Streak erreicht!
                </p>
                <p className="text-sm text-green-700">
                  Du hast 7 Tage in Folge Todos erledigt
                </p>
              </div>
              <Badge variant="secondary">+100 XP</Badge>
            </div>

            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Zap className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="font-medium text-blue-900">Produktiver Tag</p>
                <p className="text-sm text-blue-700">
                  12 Todos an einem Tag erledigt
                </p>
              </div>
              <Badge variant="secondary">+50 XP</Badge>
            </div>

            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <Target className="h-5 w-5 text-purple-600" />
              <div className="flex-1">
                <p className="font-medium text-purple-900">
                  Schwere Aufgaben Meister
                </p>
                <p className="text-sm text-purple-700">
                  10 Hard-Difficulty Todos abgeschlossen
                </p>
              </div>
              <Badge variant="secondary">+200 XP</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
