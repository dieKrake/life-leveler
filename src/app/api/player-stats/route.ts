// app/api/player-stats/route.ts
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

  // TEMPORARY: Use direct queries instead of broken function
  const { data: playerData, error: playerError } = await supabase
    .from("player_stats")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (playerError) {
    console.error("Fehler beim Laden der Player Stats:", playerError);
    // Return default stats for new users
    const { data: level1Stats } = await supabase
      .from("levels")
      .select("xp_required")
      .eq("level", 1)
      .single();
    const { data: level2Stats } = await supabase
      .from("levels")
      .select("xp_required")
      .eq("level", 2)
      .single();
    return NextResponse.json({
      level: 1,
      xp: 0,
      xp_for_current_level: level1Stats?.xp_required ?? 0,
      xp_for_next_level: level2Stats?.xp_required ?? 100,
      current_streak: 0,
      highest_streak: 0,
      streak_multiplier: 1.0,
      gems: 0,
      prestige: 0,
      max_level_reached: 1,
      can_prestige: false,
    });
  }

  // Get level requirements
  const { data: currentLevelData } = await supabase
    .from("levels")
    .select("xp_required")
    .eq("level", playerData.level)
    .single();

  let nextLevelData = null;
  if (playerData.level < 10) {
    const { data } = await supabase
      .from("levels")
      .select("xp_required")
      .eq("level", playerData.level + 1)
      .single();
    nextLevelData = data;
  }

  // Get streak multiplier
  const { data: multiplierData } = await supabase
    .rpc("get_streak_multiplier", { streak_days: playerData.current_streak });

  const stats = {
    xp: playerData.xp || 0,
    level: playerData.level || 1,
    xp_for_current_level: currentLevelData?.xp_required || 0,
    xp_for_next_level: nextLevelData?.xp_required || null,
    current_streak: playerData.current_streak || 0,
    highest_streak: playerData.highest_streak || 0,
    streak_multiplier: multiplierData || 1.0,
    gems: playerData.gems || 0,
    prestige: playerData.prestige || 0,
    max_level_reached: playerData.max_level_reached || 1,
    can_prestige: (playerData.level || 1) >= 10,
  };

  return NextResponse.json(stats);
}
