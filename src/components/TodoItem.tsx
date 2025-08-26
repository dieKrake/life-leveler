"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Todo } from "@/types";
import { KeyedMutator } from "swr";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { formatTodoDate } from "@/lib/dateUtils";
import DeleteTodoButton from "./DeleteTodoButton";

type TodoItemProps = {
  todo: Todo;
  todos: Todo[] | undefined;
  mutate: KeyedMutator<Todo[]>;
};

export default function TodoItem({ todo, todos, mutate }: TodoItemProps) {
  const supabase = createClientComponentClient();
  const [isChecked, setIsChecked] = useState(todo.is_completed);

  useEffect(() => {
    setIsChecked(todo.is_completed);
  }, [todo.is_completed]);

  const handleToggleComplete = async (checked: boolean) => {
    setIsChecked(checked);

    // NEUE LOGIK: Wir unterscheiden zwischen "erledigen" und "rückgängig machen"
    if (checked) {
      // ---- FALL 1: Aufgabe wird als erledigt markiert ----

      // Rufe die Datenbank-Funktion auf, die XP vergibt und das Todo aktualisiert
      const { error } = await supabase.rpc("complete_todo", {
        todo_id: todo.id,
      });

      if (error) {
        console.error("Fehler beim Erledigen des Todos:", error);
        setIsChecked(false); // Bei Fehler zurücksetzen
      } else {
        // Lade die gesamte Seite neu. Das aktualisiert die Todos-Liste
        // UND die PlayerStatsBar mit den neuen XP.
        window.location.reload();
      }
    } else {
      // ---- FALL 2: Das Erledigen wird rückgängig gemacht ----
      // Hier werden keine XP vergeben, wir machen nur ein einfaches Update.

      const { error } = await supabase
        .from("todos")
        .update({ is_completed: false })
        .eq("id", todo.id);

      if (error) {
        console.error("Fehler beim Rückgängigmachen des Todos:", error);
        setIsChecked(true); // Bei Fehler zurücksetzen
      } else {
        // Hier reicht ein 'mutate', da sich die XP nicht ändern.
        mutate();
      }
    }
  };

  const todoId = `todo-${todo.id}`;

  return (
    <li className="flex items-center space-x-3 p-3 border rounded-md bg-card">
      <Checkbox
        id={todoId}
        checked={isChecked}
        onCheckedChange={handleToggleComplete}
        className="mt-1 self-start"
      />
      <div className="grid gap-1.5 leading-none flex-1">
        <Label
          htmlFor={todoId}
          className={`text-sm font-medium ${
            isChecked ? "line-through text-muted-foreground" : ""
          }`}
        >
          {todo.title}
        </Label>
        <p className="text-sm text-muted-foreground">
          {formatTodoDate(todo.start_time, todo.end_time)}
        </p>
      </div>

      {/* Zeige den Löschen-Button nur bei erledigten Aufgaben */}
      {todo.is_completed && (
        <div className="ml-auto">
          <DeleteTodoButton todo={todo} todos={todos} mutate={mutate} />
        </div>
      )}
    </li>
  );
}
