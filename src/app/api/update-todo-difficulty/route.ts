import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateDifficultySchema = z.object({
  todoId: z.number().int().positive(),
  xpValue: z
    .number()
    .int()
    .refine((val) => [10, 20, 30].includes(val), {
      message: "XP-Wert muss 10, 20 oder 30 sein",
    }),
});

export async function POST(request: Request) {
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
    const body = await request.json();
    const validation = updateDifficultySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );
    }

    const { todoId, xpValue } = validation.data;

    // Rufe die Supabase-Funktion auf
    const { data, error } = await supabase.rpc("update_todo_difficulty", {
      todo_id: todoId,
      user_id: session.user.id,
      new_xp_value: xpValue,
    });

    if (error) {
      console.error("Supabase RPC Error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Fehler in update-todo-difficulty Route:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unbekannter Fehler" },
      { status: 500 }
    );
  }
}
