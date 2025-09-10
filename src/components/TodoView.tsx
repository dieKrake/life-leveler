"use client";

import useSWR from "swr";
import TodoItem from "./TodoItem";
import type { Todo } from "@/types";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import AddTodoSheet from "./AddTodoSheet";

export default function TodoView() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const supabase = createClientComponentClient();

  const {
    data: todos,
    error,
    isLoading,
    mutate,
  } = useSWR<Todo[]>("/api/get-todos");

  const incompleteTodos = useMemo(
    () => todos?.filter((todo) => !todo.is_completed) || [],
    [todos]
  );
  const completedTodos = useMemo(
    () => todos?.filter((todo) => todo.is_completed) || [],
    [todos]
  );

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch("/api/sync-events", { method: "POST" });

      if (!response.ok) {
        if (response.status === 401) {
          await supabase.auth.signOut();
          window.location.href = "/login";
        }
        throw new Error("Synchronisierung fehlgeschlagen");
      }

      mutate();
    } catch (err) {
      console.error("Fehler bei der Synchronisierung:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return <p>Lade Todos...</p>;
  }
  if (error) {
    return <p className="text-red-500">Fehler: {error.message}</p>;
  }

  return (
    <div className="w-full space-y-8">
      <div className="flex flex-col md:flex-row justify-end gap-2">
        <Button onClick={() => setIsSheetOpen(true)}>Todo hinzufügen</Button>
        <Button onClick={handleSync} disabled={isSyncing}>
          {isSyncing
            ? "Synchronisiere..."
            : "Mit Google Kalender synchronisieren"}
        </Button>
      </div>

      <AddTodoSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        todos={todos}
        mutate={mutate}
      />

      <div className="flex flex-col md:flex-row gap-16 w-full h-[67vh]">
        {/* Offene Aufgaben */}
        <div className="w-full flex flex-col">
          <h2 className="text-2xl font-semibold mb-4">Offene Aufgaben</h2>
          <div className="flex-1 overflow-y-auto">
            {incompleteTodos.length > 0 ? (
              <ul className="space-y-3 pr-2">
                {incompleteTodos.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    todos={todos}
                    mutate={mutate}
                  />
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">
                Super! Keine offenen Aufgaben.
              </p>
            )}
          </div>
        </div>

        {/* Erledigte Aufgaben */}
        <div className="w-full flex flex-col">
          <h2 className="text-2xl font-semibold mb-4">Erledigte Aufgaben</h2>
          <div className="flex-1 overflow-y-auto">
            {completedTodos.length > 0 ? (
              <ul className="space-y-3 pr-2">
                {completedTodos.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    todos={todos}
                    mutate={mutate}
                  />
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">
                Noch keine Aufgaben erledigt.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
