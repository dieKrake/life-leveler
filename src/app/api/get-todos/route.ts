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

  const { data: todos, error } = await supabase
    .from("todos")
    .select("*")
    .eq("user_id", session.user.id)
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Fehler beim Lesen der Todos:", error);
    return NextResponse.json(
      { error: "Fehler beim Lesen der Todos aus der Datenbank" },
      { status: 500 }
    );
  }

  return NextResponse.json(todos);
}
