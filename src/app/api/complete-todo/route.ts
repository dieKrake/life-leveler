import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

const completeTodoSchema = z.object({
  todoId: z.string(),
  completed: z.boolean(),
});

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session || !session.provider_token) {
    return NextResponse.json(
      { error: "Nicht authentifiziert oder Provider-Token fehlt" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const validation = completeTodoSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );
    }

    const { todoId, completed } = validation.data;

    // 1. Get todo details to check if it has a google_event_id
    const { data: todo, error: todoError } = await supabase
      .from("todos")
      .select("google_event_id, title")
      .eq("id", todoId)
      .eq("user_id", session.user.id)
      .single();

    if (todoError || !todo) {
      return NextResponse.json(
        { error: "Todo nicht gefunden" },
        { status: 404 }
      );
    }

    // 2. Update local database first (this now triggers challenge updates automatically)
    let levelUpInfo = null;
    if (completed) {
      const { data, error } = await supabase.rpc("complete_todo", {
        todo_id: parseInt(todoId),
      });
      if (error) {
        console.error("Error completing todo:", error);
        throw error;
      }
      levelUpInfo = data?.[0]; // Get the first (and only) result
    } else {
      const { error } = await supabase.rpc("uncomplete_todo", {
        todo_id: parseInt(todoId),
      });
      if (error) throw error;
    }

    // 3. Sync with Google if todo has google_event_id
    if (todo.google_event_id) {
      try {
        if (todo.google_event_id.startsWith("tsk-")) {
          const taskId = todo.google_event_id.replace("tsk-", "");
          const taskUpdateUrl = `https://www.googleapis.com/tasks/v1/lists/@default/tasks/${taskId}`;

          const taskResponse = await fetch(taskUpdateUrl, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${session.provider_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: completed ? "completed" : "needsAction",
            }),
          });

          if (!taskResponse.ok) {
            console.error(
              "Fehler beim Aktualisieren der Google Task:",
              await taskResponse.text()
            );
          }
        } else if (todo.google_event_id.startsWith("evt-")) {
          const eventId = todo.google_event_id.replace("evt-", "");
          const eventUpdateUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`;

          const eventResponse = await fetch(eventUpdateUrl, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${session.provider_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: completed ? "cancelled" : "confirmed",
            }),
          });

          if (!eventResponse.ok) {
            console.error(
              "Fehler beim Aktualisieren des Google Events:",
              await eventResponse.text()
            );
          }
        }
      } catch (googleError) {
        console.error("Fehler bei der Google-Synchronisation:", googleError);
      }
    }

    return NextResponse.json({
      success: true,
      message: completed
        ? "Todo erfolgreich erledigt"
        : "Todo als unerledigt markiert",
      // Signal that challenges might have been updated
      challengesUpdated: completed,
      // Include level-up information if available
      levelUp: levelUpInfo,
    });
  } catch (error) {
    console.error("Fehler beim Aktualisieren des Todos:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unbekannter Fehler" },
      { status: 500 }
    );
  }
}
