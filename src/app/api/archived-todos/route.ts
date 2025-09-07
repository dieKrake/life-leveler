import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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
    // Fetch archived todos with statistics
    const { data: archivedTodos, error } = await supabase
      .from("todos")
      .select("*")
      .eq("user_id", session.user.id)
      .not("archived_at", "is", null)
      .order("archived_at", { ascending: false });

    if (error) {
      throw error;
    }

    // Calculate statistics
    const totalArchived = archivedTodos?.length || 0;
    const archivedThisMonth =
      archivedTodos?.filter((todo) => {
        const archivedDate = new Date(todo.archived_at);
        const now = new Date();
        return (
          archivedDate.getMonth() === now.getMonth() &&
          archivedDate.getFullYear() === now.getFullYear()
        );
      }).length || 0;

    const archivedThisWeek =
      archivedTodos?.filter((todo) => {
        const archivedDate = new Date(todo.archived_at);
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return archivedDate >= weekAgo;
      }).length || 0;

    // Group by month for chart data
    const monthlyStats =
      archivedTodos?.reduce((acc, todo) => {
        const date = new Date(todo.archived_at);
        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;
        acc[monthKey] = (acc[monthKey] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

    return NextResponse.json({
      todos: archivedTodos,
      statistics: {
        totalArchived,
        archivedThisMonth,
        archivedThisWeek,
        monthlyStats,
      },
    });
  } catch (error) {
    console.error("Fehler beim Abrufen der archivierten Todos:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unbekannter Fehler" },
      { status: 500 }
    );
  }
}
