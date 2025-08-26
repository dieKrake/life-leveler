// src/components/TodoItem.tsx
"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Todo } from "@/types";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { formatTodoDate } from "@/lib/dateUtils";

type TodoItemProps = {
  todo: Todo;
  onUpdate: () => void;
};

export default function TodoItem({ todo, onUpdate }: TodoItemProps) {
  const supabase = createClientComponentClient();
  const [isChecked, setIsChecked] = useState(todo.is_completed);

  useEffect(() => {
    setIsChecked(todo.is_completed);
  }, [todo.is_completed]);

  const handleToggleComplete = async (checked: boolean) => {
    setIsChecked(checked);

    const { error } = await supabase
      .from("todos")
      .update({ is_completed: checked })
      .eq("id", todo.id);

    if (error) {
      console.error("Fehler beim Aktualisieren des Todos:", error);
      setIsChecked(!checked);
    } else {
      onUpdate();
    }
  };

  const todoId = `todo-${todo.id}`;

  return (
    <li className="flex items-start space-x-3 p-3 border rounded-md bg-card">
      <Checkbox
        id={todoId}
        checked={isChecked}
        onCheckedChange={handleToggleComplete}
        className="mt-1"
      />
      <div className="grid gap-1.5 leading-none">
        <Label
          htmlFor={todoId}
          className={`text-sm font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
            isChecked ? "line-through text-muted-foreground" : ""
          }`}
        >
          {todo.title}
        </Label>
        <p className="text-sm text-muted-foreground">
          {formatTodoDate(todo.start_time, todo.end_time)}
        </p>
      </div>
    </li>
  );
}
