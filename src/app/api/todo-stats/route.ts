import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Nicht authentifiziert" },
      { status: 401 }
    );
  }

  try {
    // Basic todo counts
    const { data: totalTodos, count: totalCount } = await supabase
      .from("todos")
      .select("id", { count: "exact" })
      .eq("user_id", user.id);

    const { data: completedTodos, count: completedCount } = await supabase
      .from("todos")
      .select("id", { count: "exact" })
      .eq("user_id", user.id)
      .eq("is_completed", true);

    // Get player stats for streak and XP info
    const { data: playerStats, error: playerStatsError } = await supabase
      .rpc("get_player_stats_with_level_info")
      .single();

    if (playerStatsError) {
      console.error("Player stats error:", playerStatsError);
    }

    // Get only completed todos with completed_at timestamps
    const { data: completedTodosWithTimestamps } = await supabase
      .from("todos")
      .select("completed_at, xp_value")
      .eq("user_id", user.id)
      .eq("is_completed", true)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false });

    console.log(
      "Completed todos with timestamps:",
      completedTodosWithTimestamps?.length || 0
    );

    // Process daily completions for current week (last 7 days)
    const dailyData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dayName = date.toLocaleDateString("de-DE", { weekday: "short" });
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const count =
        completedTodosWithTimestamps?.filter((todo) => {
          const completedDate = new Date(todo.completed_at!);
          return completedDate >= dayStart && completedDate <= dayEnd;
        }).length || 0;

      return {
        day: dayName,
        completed: count,
        target: 5,
      };
    });

    // Process weekly trend (last 5 weeks)
    const weeklyData = Array.from({ length: 5 }, (_, i) => {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (weekStart.getDay() + 7 * i));
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const count =
        completedTodosWithTimestamps?.filter((todo) => {
          const completedDate = new Date(todo.completed_at!);
          return completedDate >= weekStart && completedDate <= weekEnd;
        }).length || 0;

      // Calculate proper ISO week number
      const getWeekNumber = (date: Date): number => {
        const d = new Date(
          Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
        );
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil(
          ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
        );
      };

      const weekNumber = getWeekNumber(weekStart);
      return {
        week: `KW ${weekNumber}`,
        todos: count,
      };
    }).reverse();

    // Process difficulty distribution
    const difficultyDistribution = [
      { difficulty: "Easy", count: 0, xp: 10, color: "bg-green-500" },
      { difficulty: "Medium", count: 0, xp: 20, color: "bg-yellow-500" },
      { difficulty: "Hard", count: 0, xp: 30, color: "bg-red-500" },
    ];

    completedTodosWithTimestamps?.forEach((todo) => {
      if (todo.xp_value === 10) difficultyDistribution[0].count++;
      else if (todo.xp_value === 20) difficultyDistribution[1].count++;
      else if (todo.xp_value === 30) difficultyDistribution[2].count++;
    });

    // Process hourly activity (6 AM to 8 PM)
    const hourlyData = Array.from({ length: 15 }, (_, i) => {
      const hour = i + 6; // 6 AM to 8 PM
      const count =
        completedTodosWithTimestamps?.filter((todo) => {
          const completedDate = new Date(todo.completed_at!);
          return completedDate.getHours() === hour;
        }).length || 0;

      return {
        hour: hour.toString(),
        count,
      };
    });

    // Find most productive hour
    const mostProductiveHour = hourlyData.reduce(
      (max, current) => (current.count > max.count ? current : max),
      hourlyData[0]
    );

    const stats = {
      totalTodos: totalCount || 0,
      completedTodos: completedCount || 0,
      completedTodosWithTimestamps: completedTodosWithTimestamps?.length || 0,
      currentStreak: (playerStats as any)?.current_streak || 0,
      totalXP: (playerStats as any)?.xp || 0,
      totalGems: (playerStats as any)?.gems || 0,
      productiveHour: `${mostProductiveHour.hour}:00`,
      dailyCompletions: dailyData,
      weeklyTrend: weeklyData,
      difficultyDistribution,
      hourlyActivity: hourlyData,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Fehler beim Laden der Todo-Statistiken:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Statistiken" },
      { status: 500 }
    );
  }
}
