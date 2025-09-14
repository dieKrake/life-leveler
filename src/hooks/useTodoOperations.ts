import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { KeyedMutator } from "swr";
import type { Todo } from "@/types";

export function useTodoOperations(mutate: KeyedMutator<Todo[]>) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const supabase = createClientComponentClient();

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

  const handleArchiveAllCompleted = async () => {
    setIsArchiving(true);
    try {
      const response = await fetch("/api/archive-completed-todos", {
        method: "POST",
      });

      if (!response.ok) {
        if (response.status === 401) {
          await supabase.auth.signOut();
          window.location.href = "/login";
        }
        throw new Error("Archivierung fehlgeschlagen");
      }

      const result = await response.json();
      console.log(result.message);
      mutate();
    } catch (err) {
      console.error("Fehler beim Archivieren der erledigten Todos:", err);
    } finally {
      setIsArchiving(false);
    }
  };

  return {
    isSyncing,
    isArchiving,
    handleSync,
    handleArchiveAllCompleted,
  };
}
