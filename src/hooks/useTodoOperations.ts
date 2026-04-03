import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { KeyedMutator } from "swr";
import type { Todo } from "@/types";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";

export function useTodoOperations(mutate: KeyedMutator<Todo[]>) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const supabase = createClientComponentClient();
  const { t } = useTranslation();

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch("/api/sync-events", { method: "POST" });

      if (response.status === 401) {
        toast.error(t("errors.sessionExpired"));
        await supabase.auth.signOut();
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        toast.error(t("sync.syncFailed"));
        throw new Error(t("sync.syncFailed"));
      }

      toast.success(t("sync.syncSuccess"));
      mutate();
    } catch (err) {
      console.error("Error during sync:", err);
      toast.error(t("sync.syncError"));
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
        toast.error(t("errors.sessionExpired"));
        await supabase.auth.signOut();
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        toast.error(t("archive.archiveFailed"));
        throw new Error(t("archive.archiveFailed"));
      }

      const result = await response.json();
      toast.success(
        t("archive.archiveAllSuccess", { count: result.archivedCount }),
      );
      mutate();
    } catch (err) {
      console.error("Error archiving completed todos:", err);
      toast.error(t("archive.archiveError"));
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
