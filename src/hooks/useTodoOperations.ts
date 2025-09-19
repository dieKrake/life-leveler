import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { KeyedMutator } from "swr";
import type { Todo } from "@/types";
import { toast } from "sonner";

export function useTodoOperations(mutate: KeyedMutator<Todo[]>) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const supabase = createClientComponentClient();

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch("/api/sync-events", { method: "POST" });

      if (response.status === 401) {
        toast.error(
          "Deine Sitzung ist abgelaufen. Bitte melde dich erneut an."
        );
        await supabase.auth.signOut();
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        toast.error(
          "Synchronisierung fehlgeschlagen. Bitte versuche es erneut."
        );
        throw new Error("Synchronisierung fehlgeschlagen");
      }

      toast.success("Synchronisierung erfolgreich abgeschlossen!");
      mutate();
    } catch (err) {
      console.error("Fehler bei der Synchronisierung:", err);
      toast.error("Ein Fehler ist bei der Synchronisierung aufgetreten.");
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

      if (response.status === 401) {
        toast.error(
          "Deine Sitzung ist abgelaufen. Bitte melde dich erneut an."
        );
        await supabase.auth.signOut();
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        toast.error("Archivierung fehlgeschlagen. Bitte versuche es erneut.");
        throw new Error("Archivierung fehlgeschlagen");
      }

      const result = await response.json();
      toast.success(
        `${result.archivedCount} erledigte Todos erfolgreich archiviert!`
      );
      mutate();
    } catch (err) {
      console.error("Fehler beim Archivieren der erledigten Todos:", err);
      toast.error("Ein Fehler ist beim Archivieren aufgetreten.");
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
