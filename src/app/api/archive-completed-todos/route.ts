import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
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
    // First, get all completed todos that are not yet archived
    const { data: completedTodos, error: fetchError } = await supabase
      .from("todos")
      .select("id, google_event_id")
      .eq("user_id", session.user.id)
      .eq("is_completed", true)
      .is("archived_at", null);

    if (fetchError) {
      throw fetchError;
    }

    if (!completedTodos || completedTodos.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Keine erledigten Todos zum Archivieren gefunden.",
        archivedCount: 0,
      });
    }

    // Archive all completed todos by setting archived_at timestamp
    const { error: archiveError } = await supabase
      .from("todos")
      .update({
        archived_at: new Date().toISOString(),
      })
      .eq("user_id", session.user.id)
      .eq("is_completed", true)
      .is("archived_at", null);

    if (archiveError) {
      throw archiveError;
    }

    // Optional: Delete corresponding Google Calendar events/tasks if they exist
    if (session.provider_token) {
      const deletePromises = completedTodos.map(async (todo) => {
        if (!todo.google_event_id) return;

        try {
          if (todo.google_event_id.startsWith("evt-")) {
            const eventId = todo.google_event_id.substring(4);
            const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`;
            await fetch(url, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${session.provider_token}` },
            });
          } else if (todo.google_event_id.startsWith("tsk-")) {
            const taskId = todo.google_event_id.substring(4);
            const url = `https://www.googleapis.com/tasks/v1/lists/@default/tasks/${taskId}`;
            await fetch(url, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${session.provider_token}` },
            });
          }
        } catch (error) {
          console.error(
            `Fehler beim Löschen von Google Item ${todo.google_event_id}:`,
            error
          );
          // Continue with other deletions even if one fails
        }
      });

      await Promise.allSettled(deletePromises);
    }

    return NextResponse.json({
      success: true,
      message: `${completedTodos.length} erledigte Todos erfolgreich archiviert.`,
      archivedCount: completedTodos.length,
    });
  } catch (error) {
    console.error("Fehler beim Archivieren der erledigten Todos:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unbekannter Fehler" },
      { status: 500 }
    );
  }
}
