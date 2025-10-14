import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// TEMPORARY ENDPOINT FOR TESTING - REMOVE IN PRODUCTION!
export async function POST() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current achievements to calculate gems to subtract
    const { data: currentAchievements } = await supabase
      .from("user_achievements")
      .select(`
        achievement_id,
        achievements!inner(reward_gems)
      `)
      .eq("user_id", user.id);

    // Calculate total gems from achievements
    const totalGemsFromAchievements = currentAchievements?.reduce(
      (sum, ua) => sum + (ua.achievements as any).reward_gems,
      0
    ) || 0;

    // Delete all user achievements
    const { error: deleteError } = await supabase
      .from("user_achievements")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) {
      throw deleteError;
    }

    // Subtract gems that were earned from achievements
    if (totalGemsFromAchievements > 0) {
      const { error: gemsError } = await supabase.rpc(
        "update_player_xp_and_gems",
        {
          p_xp_change: 0,
          p_gems_change: -totalGemsFromAchievements,
        }
      );

      if (gemsError) {
        console.error("Error subtracting gems:", gemsError);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Reset ${currentAchievements?.length || 0} achievements and subtracted ${totalGemsFromAchievements} gems`,
      achievementsReset: currentAchievements?.length || 0,
      gemsSubtracted: totalGemsFromAchievements,
    });
  } catch (error) {
    console.error("Error resetting achievements:", error);
    return NextResponse.json(
      { error: "Failed to reset achievements" },
      { status: 500 }
    );
  }
}
