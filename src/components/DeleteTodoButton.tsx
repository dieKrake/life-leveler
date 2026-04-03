// src/components/DeleteTodoButton.tsx
"use client";

import { useState } from "react";
import { KeyedMutator } from "swr";
import { Archive } from "lucide-react";
import type { Todo } from "@/types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
import { useTranslation } from "@/hooks/useTranslation";

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
  const { t } = useTranslation();

  const handleTokenExpiration = async () => {
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
        toast.error(t("errors.sessionExpired"));
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || t("errors.todoArchiveError"));
      }

      // Re-validiere die Daten nach erfolgreichem Archivieren
      mutate();
      toast.success(t("archive.archiveSuccess"));
    } catch (error) {
      console.error(error);
      toast.error(t("errors.unexpectedError"));
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
          <AlertDialogTitle>{t("archive.archiveTodo")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("archive.archiveTodoDescription", { title: todo.title || "" })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={handleArchive} disabled={isArchiving}>
            {isArchiving ? t("archive.archiving") : t("archive.archive")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
