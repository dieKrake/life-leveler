import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, CheckCircle2, Clock, BarChart3 } from "lucide-react";
import type { TodoStats } from "@/types";

interface StatsKeyMetricsProps {
  stats: TodoStats;
}

export function StatsKeyMetrics({ stats }: StatsKeyMetricsProps) {
  return (
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
          <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
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
            {stats.completedTodos} von {stats.totalTodos} Todos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Produktivste Zeit
          </CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.productiveHour}</div>
          <p className="text-xs text-muted-foreground">Beste Tageszeit</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Highest Streak</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.highestStreak}</div>
          <p className="text-xs text-muted-foreground">
            Current streak: {stats.currentStreak}
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
