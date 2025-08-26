"use client";

import useSWR from "swr";
import TodoItem from "./TodoItem";
import type { Todo } from "@/types";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import AddTodoSheet from "./AddTodoSheet";

export default function CalendarView() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false); // State für das Sheet
  const supabase = createClientComponentClient();

  // Ruft die schnelle Lese-Route auf, um Daten aus der DB anzuzeigen
  const {
    data: todos,
    error,
    isLoading,
    mutate,
  } = useSWR<Todo[]>("/api/get-todos");

  // Filtert die Todos in zwei separate Listen für die Anzeige
  const incompleteTodos = useMemo(
    () => todos?.filter((todo) => !todo.is_completed) || [],
    [todos]
  );
  const completedTodos = useMemo(
    () => todos?.filter((todo) => todo.is_completed) || [],
    [todos]
  );

  // Löst die Synchronisierung mit Google aus
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch("/api/sync-events", { method: "POST" });

      // Reagiert auf Fehler, insbesondere auf einen abgelaufenen Token (401)
      if (!response.ok) {
        if (response.status === 401) {
          await supabase.auth.signOut();
          window.location.href = "/login";
        }
        throw new Error("Synchronisierung fehlgeschlagen");
      }

      // Bei Erfolg: Weist SWR an, die Daten neu zu laden, um die UI zu aktualisieren
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
      <div className="flex justify-end">
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

      <div className="flex flex-col md:flex-row gap-16 w-full">
        {/* Offene Aufgaben */}
        <div className="w-full">
          <h2 className="text-2xl font-semibold mb-4">Offene Aufgaben</h2>
          {incompleteTodos.length > 0 ? (
            <ul className="space-y-3">
              {incompleteTodos.map((todo) => (
                <TodoItem key={todo.id} todo={todo} onUpdate={mutate} />
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">
              Super! Keine offenen Aufgaben.
            </p>
          )}
        </div>

        {/* Erledigte Aufgaben */}
        <div className="w-full">
          <h2 className="text-2xl font-semibold mb-4">Erledigte Aufgaben</h2>
          {completedTodos.length > 0 ? (
            <ul className="space-y-3">
              {completedTodos.map((todo) => (
                <TodoItem key={todo.id} todo={todo} onUpdate={mutate} />
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
  );
}
