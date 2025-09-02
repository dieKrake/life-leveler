"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Todo } from "@/types";
import useSWR, { KeyedMutator, useSWRConfig } from "swr";
import { PlayerStats } from "@/types";
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
  const { mutate: globalMutate } = useSWRConfig();
  const { data: stats, isLoading } = useSWR<PlayerStats>("/api/player-stats");

  if (!stats) {
    return <div className="w-full bg-muted border-b">Lade Stats...</div>;
  }

  const {
    level,
    xp,
    xp_for_current_level,
    xp_for_next_level,
    current_streak,
    streak_multiplier,
  } = stats;

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
        mutate();
        globalMutate("/api/player-stats");
      }
    } else {
      const { error } = await supabase.rpc("uncomplete_todo", {
        todo_id: todo.id,
      });

      if (error) {
        console.error("Fehler beim Rückgängigmachen des Todos:", error);
        setIsChecked(true);
      } else {
        mutate();
        globalMutate("/api/player-stats");
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
        <div className="flex justify-between items-center">
          <Label
            htmlFor={todoId}
            className={`text-sm font-medium ${
              isChecked ? "line-through text-muted-foreground" : ""
            }`}
          >
            {todo.title}
          </Label>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            {todo.xp_value} XP
            {streak_multiplier > 1.0 && (
              <span className="text-xs font-semibold bg-amber-500 text-white px-1.5 py-0.5 rounded-full">
                x{streak_multiplier.toFixed(1)} XP
              </span>
            )}
          </p>
        </div>
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
