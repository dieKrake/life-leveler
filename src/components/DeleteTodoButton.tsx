// src/components/DeleteTodoButton.tsx
"use client";

import { useState } from "react";
import { KeyedMutator } from "swr";
import { Archive } from "lucide-react";
import type { Todo } from "@/types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type DeleteTodoButtonProps = {
  todo: Todo;
  todos: Todo[] | undefined;
  mutate: KeyedMutator<Todo[]>;
};

export default function DeleteTodoButton({
  todo,
  todos,
  mutate,
}: DeleteTodoButtonProps) {
  const [isArchiving, setIsArchiving] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();

  const handleTokenExpiration = async () => {
    console.log("Token expired, logging out user...");
    await supabase.auth.signOut();
    router.push("/auth");
  };

  const handleArchive = async () => {
    if (!todos) return;
    setIsArchiving(true);

    // Optimistisches Update: Entferne das Todo sofort aus der UI
    const optimisticData = todos.filter((t) => t.id !== todo.id);
    mutate(optimisticData, false);

    try {
      const response = await fetch(`/api/delete-todo/${todo.google_event_id}`, {
        method: "DELETE",
      });

      // Check for authentication errors (401 or 403)
      if (response.status === 401 || response.status === 403) {
        await handleTokenExpiration();
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || "Fehler beim Archivieren des Todos."
        );
      }

      // Re-validiere die Daten nach erfolgreichem Archivieren
      mutate();
    } catch (error) {
      console.error(error);
      // Bei einem Fehler: Setze die UI auf den ursprünglichen Zustand zurück
      mutate(todos, false);
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Archive className="h-4 w-4 text-muted-foreground" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Todo archivieren?</AlertDialogTitle>
          <AlertDialogDescription>
            Das Todo wird aus deiner aktiven Liste entfernt und archiviert. Es
            bleibt für deine Statistiken und Achievements erhalten, wird aber
            nicht mehr in der normalen Ansicht angezeigt. Das Todo wird auch aus
            deinem Google Account gelöscht.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction onClick={handleArchive} disabled={isArchiving}>
            {isArchiving ? "Archiviere..." : "Archivieren"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
