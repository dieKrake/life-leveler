import { Button } from "@/components/ui/button";
import { Archive } from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Todo } from "@/types";
import { KeyedMutator } from "swr";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";

interface ArchiveTodoDialogProps {
  todo: Todo;
  todos: Todo[] | undefined;
  mutate: KeyedMutator<Todo[]>;
}

export default function ArchiveTodoDialog({
  todo,
  todos,
  mutate,
}: ArchiveTodoDialogProps) {
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
      // Bei einem Fehler: Setze die UI auf den ursprünglichen Zustand zurück
      mutate(todos, false);
      toast.error(t("archive.archiveError"));
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <TooltipProvider>
      <AlertDialog>
        <Tooltip>
          <TooltipTrigger asChild>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
              >
                <Archive className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("archive.archive")}</p>
          </TooltipContent>
        </Tooltip>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {t("archive.archiveTodo")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              {t("archive.archiveTodoDescription", {
                title: todo.title || "Todo",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 text-slate-300 hover:bg-slate-600">
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchive}
              disabled={isArchiving}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {isArchiving ? t("archive.archiving") : t("archive.archive")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
