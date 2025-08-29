import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const googleItemId = params.id;
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
    // --- LÖSCHEN BEI GOOGLE ---
    if (googleItemId.startsWith("evt-")) {
      const eventId = googleItemId.substring(4);
      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`;
      const response = await fetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.provider_token}` },
      });
      if (!response.ok && response.status !== 404) {
        console.error(
          "Fehler beim Löschen des Google Calendar Events:",
          response.status,
          await response.text()
        );
      }
    } else if (googleItemId.startsWith("tsk-")) {
      const taskId = googleItemId.substring(4);
      const url = `https://www.googleapis.com/tasks/v1/lists/@default/tasks/${taskId}`;
      const response = await fetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.provider_token}` },
      });

      // NEU: Detailliertes Logging für Tasks
      if (!response.ok && response.status !== 404) {
        // Wir loggen den Status und die komplette Antwort von Google
        const errorBody = await response.text();
        console.error(`Fehler beim Löschen des Google Tasks (ID: ${taskId}):`, {
          status: response.status,
          body: errorBody,
        });
        // Wir fahren trotzdem fort, um den Eintrag aus unserer DB zu löschen
      } else {
        console.log(`Google Task (ID: ${taskId}) erfolgreich gelöscht.`);
      }
    }

    // --- LÖSCHEN AUS DER EIGENEN DATENBANK ---
    const { error: dbError } = await supabase
      .from("todos")
      .delete()
      .match({ user_id: session.user.id, google_event_id: googleItemId });

    if (dbError) {
      throw dbError;
    }

    return NextResponse.json({
      success: true,
      message: "Todo erfolgreich gelöscht.",
    });
  } catch (error) {
    console.error("Fehler in delete-todo Route:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unbekannter Fehler" },
      { status: 500 }
    );
  }
}
