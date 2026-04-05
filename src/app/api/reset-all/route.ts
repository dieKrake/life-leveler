import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// TEMPORARY ENDPOINT FOR TESTING - REMOVE IN PRODUCTION!
export async function POST() {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase.rpc("reset_all_player_data");

    if (error) {
      console.error("Error resetting player data:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error resetting player data:", error);
    return NextResponse.json(
      { error: "Failed to reset player data" },
      { status: 500 },
    );
  }
}
