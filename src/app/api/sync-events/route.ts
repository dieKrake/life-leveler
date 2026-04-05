import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Typ-Definitionen für die Google-Antworten
interface GoogleEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  status?: string;
}
interface GoogleTask {
  id: string;
  title: string;
  due?: string;
  status?: string;
}

export async function POST() {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session || !session.provider_token) {
    return NextResponse.json(
      { error: "Nicht authentifiziert oder Provider-Token fehlt" },
      { status: 401 },
    );
  }

  // --- 1. Termine von Google Calendar holen ---
  const calendarApiUrl = new URL(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
  );
  calendarApiUrl.searchParams.append("timeMin", new Date().toISOString());
  calendarApiUrl.searchParams.append("maxResults", "50");
  calendarApiUrl.searchParams.append("singleEvents", "true");
  calendarApiUrl.searchParams.append("orderBy", "startTime");

  const calendarResponse = await fetch(calendarApiUrl, {
    headers: { Authorization: `Bearer ${session.provider_token}` },
  });

  // Kritische Fehlerprüfung für den Kalender
  if (calendarResponse.status === 401 || calendarResponse.status === 403) {
    return NextResponse.json(
      { error: "Google Token ist ungültig oder abgelaufen." },
      { status: 401 },
    );
  }
  const googleEvents: GoogleEvent[] =
    (await calendarResponse.json()).items || [];

  // --- 2. Aufgaben von Google Tasks holen ---
  const tasksApiUrl = new URL(
    "https://www.googleapis.com/tasks/v1/lists/@default/tasks",
  );
  // Include completed tasks for status sync
  tasksApiUrl.searchParams.append("showCompleted", "true");
  tasksApiUrl.searchParams.append("showHidden", "true");

  const tasksResponse = await fetch(tasksApiUrl, {
    headers: { Authorization: `Bearer ${session.provider_token}` },
  });

  // Kritische Fehlerprüfung für Tasks
  if (tasksResponse.status === 401 || tasksResponse.status === 403) {
    return NextResponse.json(
      { error: "Google Token ist ungültig oder abgelaufen." },
      { status: 401 },
    );
  }

  let googleTasks: GoogleTask[] = [];
  if (tasksResponse.ok) {
    googleTasks = (await tasksResponse.json()).items || [];
  } else {
    // Logge den Fehler, aber fahre fort, damit zumindest die Termine synchronisiert werden
    console.error(
      `Fehler bei Google Tasks API: Status ${tasksResponse.status}`,
      await tasksResponse.text(),
    );
  }

  // --- 3. Daten aufbereiten und zusammenführen ---
  const calendarTodos = googleEvents
    .filter((e) => e.summary)
    .map((event) => ({
      user_id: session.user.id,
      google_event_id: `evt-${event.id}`,
      title: event.summary,
      start_time: event.start?.dateTime || event.start?.date,
      end_time: event.end?.dateTime || event.end?.date,
    }));
  const taskTodos = googleTasks
    .filter((t) => t.title)
    .map((task) => ({
      user_id: session.user.id,
      google_event_id: `tsk-${task.id}`,
      title: task.title,
      start_time: task.due || new Date().toISOString(),
      end_time: task.due || new Date().toISOString(),
    }));
  const allTodosToUpsert = [...calendarTodos, ...taskTodos];

  // --- 4. In die Datenbank schreiben ---
  if (allTodosToUpsert.length > 0) {
    const { error: upsertError } = await supabase
      .from("todos")
      .upsert(allTodosToUpsert, { onConflict: "user_id, google_event_id" });
    if (upsertError) {
      console.error("Fehler beim Upsert:", upsertError);
      return NextResponse.json(
        { error: "Fehler beim Speichern der Todos" },
        { status: 500 },
      );
    }
  }

  // --- 5. Sync completion status for existing todos (Google → App) ---
  const { data: existingTodos, error: fetchError } = await supabase
    .from("todos")
    .select("id, google_event_id, is_completed")
    .not("google_event_id", "is", null)
    .is("archived_at", null);

  if (fetchError) {
    console.error("Error fetching existing todos:", fetchError);
  }

  let updatedCount = 0;
  if (existingTodos && existingTodos.length > 0) {
    for (const todo of existingTodos) {
      try {
        let googleCompleted = false;
        let found = false;

        if (todo.google_event_id.startsWith("tsk-")) {
          // Check Google Task status
          const taskId = todo.google_event_id.replace("tsk-", "");
          const task = googleTasks.find((t) => t.id === taskId);
          if (task) {
            found = true;
            googleCompleted = task.status === "completed";
          }
        } else if (todo.google_event_id.startsWith("evt-")) {
          // Check Google Calendar Event status
          const eventId = todo.google_event_id.replace("evt-", "");
          const event = googleEvents.find((e) => e.id === eventId);
          if (event) {
            found = true;
            googleCompleted = event.status === "cancelled";
          }
        }

        // Update local todo if status differs
        if (found && googleCompleted !== todo.is_completed) {
          if (googleCompleted) {
            // Complete the todo
            const { error: completeError } = await supabase.rpc(
              "complete_todo",
              {
                todo_id: todo.id,
              },
            );
            if (!completeError) {
              updatedCount++;
            } else {
              console.error(`Error completing todo ${todo.id}:`, completeError);
            }
          } else {
            // Uncomplete the todo
            const { error: uncompleteError } = await supabase.rpc(
              "uncomplete_todo",
              {
                todo_id: todo.id,
              },
            );
            if (!uncompleteError) {
              updatedCount++;
            } else {
              console.error(
                `Error uncompleting todo ${todo.id}:`,
                uncompleteError,
              );
            }
          }
        }
      } catch (error) {
        console.error(`Error syncing todo ${todo.id}:`, error);
      }
    }
  }

  return NextResponse.json({
    success: true,
    message:
      updatedCount > 0
        ? `Synchronisierung erfolgreich. ${updatedCount} Todo-Status aktualisiert.`
        : "Synchronisierung erfolgreich.",
    updatedCount,
  });
}
