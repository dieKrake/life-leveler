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
      // Player Stats (using same logic as /api/player-stats)
      (async () => {
        
        // Get basic player data
        const { data: playerData, error: playerError } = await supabase
          .from("player_stats")
          .select("*")
          .eq("user_id", session.user.id)
          .single();

        if (playerError) {
          return { data: null, error: playerError };
        }

        // Get level info
        const { data: levelData, error: levelError } = await supabase
          .from("levels")
          .select("*")
          .eq("level", playerData.level)
          .single();

        if (levelError) {
          return { data: null, error: levelError };
        }

        // Calculate streak multiplier
        const { data: multiplierData, error: multiplierError } = await supabase
          .from("streak_multipliers")
          .select("*")
          .lte("min_streak_days", playerData.current_streak)
          .order("min_streak_days", { ascending: false })
          .limit(1)
          .single();

        const streak_multiplier = multiplierError ? 1.0 : multiplierData.multiplier;

        // Get next level data for correct calculation
        const { data: nextLevelData } = await supabase
          .from("levels")
          .select("*")
          .eq("level", playerData.level + 1)
          .single();

        // Use same logic as /api/player-stats for consistency
        const currentLevelXpRequired = levelData?.xp_required || 0;
        const nextLevelXpRequired = nextLevelData?.xp_required || null;
        
        // XP needed WITHIN the current level (not total XP)
        const xpNeededForNextLevel = nextLevelXpRequired ? (nextLevelXpRequired - currentLevelXpRequired) : null;

        const result = {
          ...playerData,
          xp_for_current_level: 0, // Always 0 (start of current level) - consistent with /api/player-stats
          xp_for_next_level: xpNeededForNextLevel, // XP needed within current level
          streak_multiplier,
        };

        return { data: [result], error: null };
      })(),
      
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
        user_id_param: session.user.id,
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
