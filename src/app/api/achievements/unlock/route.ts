import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
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
    const { achievementId } = await request.json();

    if (!achievementId) {
      return NextResponse.json(
        { error: "Achievement ID ist erforderlich" },
        { status: 400 }
      );
    }

    // Check if achievement exists and is active
    const { data: achievement, error: achievementError } = await supabase
      .from("achievements")
      .select("id, name, description, reward_gems")
      .eq("id", achievementId)
      .eq("is_active", true)
      .single();

    // Debug logging
    console.log("Achievement lookup:", {
      achievementId,
      achievement,
      achievementError,
    });

    if (achievementError || !achievement) {
      // Also check if achievement exists without is_active filter
      const { data: anyAchievement } = await supabase
        .from("achievements")
        .select("id, name, is_active")
        .eq("id", achievementId)
        .single();
      
      console.log("Achievement exists check:", anyAchievement);
      
      return NextResponse.json(
        { 
          error: "Achievement nicht gefunden",
          debug: {
            achievementId,
            achievementError: achievementError?.message,
            existsButInactive: anyAchievement && !anyAchievement.is_active
          }
        },
        { status: 404 }
      );
    }

    // Check if already unlocked
    const { data: existing } = await supabase
      .from("user_achievements")
      .select("id")
      .eq("user_id", user.id)
      .eq("achievement_id", achievementId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Achievement bereits freigeschaltet" },
        { status: 400 }
      );
    }

    // Unlock achievement
    const { error: unlockError } = await supabase
      .from("user_achievements")
      .insert({
        user_id: user.id,
        achievement_id: achievementId,
        unlocked_at: new Date().toISOString(),
      });

    if (unlockError) {
      console.error("Fehler beim Freischalten:", unlockError);
      return NextResponse.json(
        { error: "Fehler beim Freischalten des Achievements" },
        { status: 500 }
      );
    }

    console.log(
      `Achievement ${achievementId} erfolgreich freigeschaltet für User ${user.id}`
    );

    // Award gems using the existing database function for consistency
    const { error: gemsError } = await supabase.rpc(
      "update_player_xp_and_gems",
      {
        xp_change: 0,
        gems_change: achievement.reward_gems,
      }
    );

    if (gemsError) {
      console.error("Fehler beim Vergeben der Gems:", gemsError);
      return NextResponse.json(
        { error: "Fehler beim Vergeben der Edelsteine" },
        { status: 500 }
      );
    }

    console.log(`${achievement.reward_gems} Gems erfolgreich vergeben`);

    return NextResponse.json({
      success: true,
      message: `Achievement ${achievementId} erfolgreich freigeschaltet`,
      achievement: {
        id: achievement.id,
        title: achievement.name, // Use 'name' from database as 'title' for frontend
        description: achievement.description,
        reward_gems: achievement.reward_gems,
      },
    });
  } catch (error) {
    console.error("Unerwarteter Fehler:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
