"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Todo } from "@/types";
import { KeyedMutator, useSWRConfig } from "swr"; // useSWRConfig importieren

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { formatTodoDate } from "@/lib/dateUtils";
import DeleteTodoButton from "./DeleteTodoButton";

type TodoItemProps = {
  todo: Todo;
  todos: Todo[] | undefined;
  mutate: KeyedMutator<Todo[]>; // Dies ist die 'lokale' mutate für die Todo-Liste
};

export default function TodoItem({ todo, todos, mutate }: TodoItemProps) {
  const supabase = createClientComponentClient();
  const [isChecked, setIsChecked] = useState(todo.is_completed);

  // NEU: Zugriff auf die globale SWR-Konfiguration und ihre mutate-Funktion
  const { mutate: globalMutate } = useSWRConfig();

  useEffect(() => {
    setIsChecked(todo.is_completed);
  }, [todo.is_completed]);

  const handleToggleComplete = async (checked: boolean) => {
    setIsChecked(checked);

    if (checked) {
      const { error } = await supabase.rpc("complete_todo", {
        todo_id: todo.id,
      });

      if (error) {
        console.error("Fehler beim Erledigen des Todos:", error);
        setIsChecked(false);
      } else {
        // NEU: Statt Reload jetzt gezielte Updates
        // 1. Aktualisiere die Todo-Liste
        mutate();
        // 2. Aktualisiere die Player-Stats-Leiste über ihren API-Key
        globalMutate("/api/player-stats");
      }
    } else {
      // Das Rückgängigmachen bleibt wie gehabt
      const { error } = await supabase
        .from("todos")
        .update({ is_completed: false })
        .eq("id", todo.id);

      if (error) {
        console.error("Fehler beim Rückgängigmachen des Todos:", error);
        setIsChecked(true);
      } else {
        mutate();
        // Optional: Auch hier die Stats neu laden, falls du später XP abziehen möchtest
        globalMutate("/api/player-stats");
      }
    }
  };

  const todoId = `todo-${todo.id}`;

  return (
    // ... Dein JSX bleibt hier komplett unverändert
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
      {todo.is_completed && (
        <div className="ml-auto">
          <DeleteTodoButton todo={todo} todos={todos} mutate={mutate} />
        </div>
      )}
    </li>
  );
}
