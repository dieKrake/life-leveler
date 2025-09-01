import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

const createTodoSchema = z.object({
  title: z.string().min(1, "Titel ist erforderlich."),
  startDateTime: z.string().datetime(),
  endDateTime: z.string().datetime(),
  type: z.enum(["event", "task"]),
  xp_value: z.number().int().min(0).optional(),
});

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session || !session.provider_token) {
    return NextResponse.json(
      { error: "Nicht authentifiziert" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const validation = createTodoSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );
    }

    const { title, startDateTime, endDateTime, type, xp_value } =
      validation.data;
    let newTodoFromDb = null;

    if (type === "event") {
      const calendarApiUrl =
        "https://www.googleapis.com/calendar/v3/calendars/primary/events";
      const eventBody = {
        summary: title,
        start: { dateTime: startDateTime },
        end: { dateTime: endDateTime },
      };

      const response = await fetch(calendarApiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.provider_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventBody),
      });

      if (!response.ok) {
        console.error("Google Calendar API Error:", await response.json());
        throw new Error("Fehler beim Erstellen des Google Calendar Events");
      }

      const newGoogleEvent = await response.json();
      const { data, error } = await supabase
        .from("todos")
        .insert({
          user_id: session.user.id,
          google_event_id: `evt-${newGoogleEvent.id}`,
          title: newGoogleEvent.summary,
          start_time: newGoogleEvent.start.dateTime,
          end_time: newGoogleEvent.end.dateTime,
          xp_value: xp_value,
        })
        .select()
        .single();

      if (error) throw error;
      newTodoFromDb = data;
    } else if (type === "task") {
      const tasksApiUrl =
        "https://www.googleapis.com/tasks/v1/lists/@default/tasks";
      const taskBody = {
        title: title,
        due: startDateTime,
      };

      const response = await fetch(tasksApiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.provider_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(taskBody),
      });

      if (!response.ok) {
        console.error("Google Tasks API Error:", await response.json());
        throw new Error("Fehler beim Erstellen des Google Tasks");
      }

      const newGoogleTask = await response.json();
      const { data, error } = await supabase
        .from("todos")
        .insert({
          user_id: session.user.id,
          google_event_id: `tsk-${newGoogleTask.id}`,
          title: newGoogleTask.title,
          start_time: newGoogleTask.due,
          end_time: newGoogleTask.due,
          xp_value: xp_value,
        })
        .select()
        .single();

      if (error) throw error;
      newTodoFromDb = data;
    }

    return NextResponse.json(newTodoFromDb);
  } catch (error) {
    console.error("Fehler in create-todo Route:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unbekannter Fehler" },
      { status: 500 }
    );
  }
}
