import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
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
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";

interface PermanentDeleteDialogProps {
  todo: Todo;
  todos: Todo[] | undefined;
  mutate: KeyedMutator<Todo[]>;
}

export default function PermanentDeleteDialog({
  todo,
  todos,
  mutate,
}: PermanentDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const { t } = useTranslation();

  const handleTokenExpiration = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  const handlePermanentDelete = async () => {
    if (!todos) return;
    setIsDeleting(true);

    // Optimistisches Update: Entferne das Todo sofort aus der UI
    const optimisticData = todos.filter((t) => t.id !== todo.id);
    mutate(optimisticData, false);

    try {
      // Permanent delete from database
      const { error: deleteError } = await supabase
        .from("todos")
        .delete()
        .eq("id", todo.id);

      if (deleteError) {
        throw new Error(t("errors.todoDeleteError"));
      }

      // Delete from Google if it has a google_event_id
      if (todo.google_event_id) {
        const response = await fetch(
          `/api/delete-todo/${todo.google_event_id}`,
          {
            method: "DELETE",
          },
        );

        // Check for authentication errors (401 or 403)
        if (response.status === 401 || response.status === 403) {
          await handleTokenExpiration();
          return;
        }

        if (!response.ok) {
          console.error("Error deleting from Google, but deleted locally");
        }
      }

      // Re-validiere die Daten nach erfolgreichem Löschen
      mutate();
      toast.success(t("deleteTodo.deleteSuccess"));
    } catch (error) {
      console.error(error);
      // Bei einem Fehler: Setze die UI auf den ursprünglichen Zustand zurück
      mutate(todos, false);
      toast.error(t("deleteTodo.deleteError"));
    } finally {
      setIsDeleting(false);
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
                className="h-8 w-8 p-0 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("deleteTodo.tooltip")}</p>
          </TooltipContent>
        </Tooltip>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {t("deleteTodo.permanentDelete")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              {t("deleteTodo.permanentDeleteDescription", {
                title: todo.title || "Todo",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 text-slate-300 hover:bg-slate-600">
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePermanentDelete}
              disabled={isDeleting}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
            >
              {isDeleting
                ? t("deleteTodo.deleting")
                : t("deleteTodo.deleteAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
