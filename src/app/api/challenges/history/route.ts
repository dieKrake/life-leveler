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
    const { data, error } = await supabase
      .from("challenge_completions")
      .select(
        `
        *,
        challenges:challenge_id (
          title,
          description,
          type
        )
      `
      )
      .eq("user_id", session.user.id)
      .order("completed_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching challenge history:", error);
      return NextResponse.json(
        { error: "Fehler beim Laden der Historie" },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Ein unerwarteter Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}
