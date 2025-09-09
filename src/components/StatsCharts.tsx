import { Progress } from "@/components/ui/progress";

interface ChartData {
  day?: string;
  week?: string;
  hour?: string;
  completed?: number;
  todos?: number;
  count?: number;
  difficulty?: string;
  xp?: number;
  color?: string;
}

interface ChartProps {
  data: ChartData[];
  title: string;
  color?: string;
}

export function BarChart({ data, title, color = "bg-blue-500" }: ChartProps) {
  const maxValue = Math.max(
    ...data.map((d) => d.completed || d.todos || d.count || 0),
    1 // Ensure maxValue is at least 1 to avoid division by zero
  );

  return (
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
                    ((item.completed || item.todos || item.count || 0) /
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
              {item.completed || item.todos || item.count || 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SimpleBarChart({
  data,
  title,
  color = "bg-blue-500",
}: ChartProps) {
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
}

export function WeeklyBarChart({
  data,
  title,
  color = "bg-green-500",
}: ChartProps) {
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
}

export function PieChart({
  data,
  title,
}: {
  data: ChartData[];
  title: string;
}) {
  const total = data.reduce((sum, item) => sum + (item.count || 0), 0);

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-sm">{title}</h4>
      <div className="space-y-3">
        {data.map((item, index) => {
          const percentage = total > 0 ? ((item.count || 0) / total) * 100 : 0;
          return (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="text-sm">{item.difficulty}</span>
                </div>
                <span className="text-sm font-medium">{item.count || 0}</span>
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
}
