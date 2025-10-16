import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Debug current stats
    const { data: debugData, error: debugError } = await supabase.rpc("debug_player_stats");
    
    if (debugError) {
      console.error("Debug error:", debugError);
      return NextResponse.json({ error: debugError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      debug: debugData?.[0] || null,
      message: "Debug data retrieved successfully"
    });

  } catch (error) {
    console.error("Debug stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fix player stats
    const { error: fixError } = await supabase.rpc("fix_player_stats");
    
    if (fixError) {
      console.error("Fix error:", fixError);
      return NextResponse.json({ error: fixError.message }, { status: 500 });
    }

    // Get updated stats after fix
    const { data: updatedStats, error: statsError } = await supabase.rpc("debug_player_stats");
    
    // Also get the corrected player stats for comparison
    const { data: playerData } = await supabase
      .from("player_stats")
      .select("*")
      .eq("user_id", user.id)
      .single();
    
    return NextResponse.json({ 
      message: "Player stats fixed successfully",
      debug: updatedStats?.[0] || null,
      corrected_stats: playerData
    });

  } catch (error) {
    console.error("Fix stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
