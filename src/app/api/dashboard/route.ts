import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json(
      { error: "Nicht authentifiziert" },
      { status: 401 }
    );
  }

  try {
    // Parallel fetch all data for better performance
    const [
      playerStatsResult,
      challengesResult,
      achievementsResult,
      todosResult
    ] = await Promise.allSettled([
      // Player Stats
      supabase.rpc("get_player_stats_with_level_info", {
        p_user_id: session.user.id,
      }),
      
      // Challenges (with reset and initialization)
      (async () => {
        // Reset expired challenges and create new ones
        await supabase.rpc("reset_expired_challenges", {
          p_user_id: session.user.id,
        });

        // Initialize challenges for user if they don't exist
        await supabase.rpc("initialize_user_challenges", {
          p_user_id: session.user.id,
        });

        // Get user's active challenges
        const { data, error } = await supabase.rpc("get_user_challenges", {
          p_user_id: session.user.id,
        });

        if (error) throw error;

        // Group challenges by type
        const dailyChallenges = data?.filter((c: any) => c.type === "daily") || [];
        const weeklyChallenges = data?.filter((c: any) => c.type === "weekly") || [];

        return {
          daily: dailyChallenges,
          weekly: weeklyChallenges,
        };
      })(),

      // Achievements
      supabase.rpc("get_user_achievements_with_progress", {
        p_user_id: session.user.id,
      }),

      // Todos
      supabase
        .from("todos")
        .select("*")
        .eq("user_id", session.user.id)
        .is("archived_at", null)
        .order("start_time", { ascending: true })
    ]);

    // Process results and handle errors
    const playerStats = playerStatsResult.status === "fulfilled" && !playerStatsResult.value.error
      ? playerStatsResult.value.data?.[0]
      : null;

    const challenges = challengesResult.status === "fulfilled"
      ? challengesResult.value
      : { daily: [], weekly: [] };

    const achievements = achievementsResult.status === "fulfilled" && !achievementsResult.value.error
      ? achievementsResult.value.data
      : [];

    const todos = todosResult.status === "fulfilled" && !todosResult.value.error
      ? todosResult.value.data
      : [];

    // Log any errors for debugging
    if (playerStatsResult.status === "rejected") {
      console.error("Error fetching player stats:", playerStatsResult.reason);
    }
    if (challengesResult.status === "rejected") {
      console.error("Error fetching challenges:", challengesResult.reason);
    }
    if (achievementsResult.status === "rejected") {
      console.error("Error fetching achievements:", achievementsResult.reason);
    }
    if (todosResult.status === "rejected") {
      console.error("Error fetching todos:", todosResult.reason);
    }

    return NextResponse.json({
      playerStats,
      challenges,
      achievements,
      todos,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Unexpected error in dashboard API:", error);
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}
