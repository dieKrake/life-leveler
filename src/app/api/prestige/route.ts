import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Call prestige function
    const { data, error } = await supabase.rpc("prestige_player", {
      p_user_id: user.id,
    });

    if (error) {
      console.error("Prestige error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    const result = data[0];
    
    return NextResponse.json({
      success: true,
      new_prestige: result.new_prestige,
      gems_earned: result.gems_earned,
      achievements_reset: result.achievements_reset,
    });
  } catch (error) {
    console.error("Prestige API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
