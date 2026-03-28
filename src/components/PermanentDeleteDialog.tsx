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
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

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
  const supabase = createClientComponentClient();
  const router = useRouter();

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
        throw new Error("Fehler beim Löschen des Todos aus der Datenbank.");
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
          console.error("Fehler beim Löschen aus Google, aber lokal gelöscht");
        }
      }

      // Re-validiere die Daten nach erfolgreichem Löschen
      mutate();
      toast.success("Todo permanent gelöscht.");
    } catch (error) {
      console.error(error);
      // Bei einem Fehler: Setze die UI auf den ursprünglichen Zustand zurück
      mutate(todos, false);
      toast.error("Fehler beim Löschen des Todos. Bitte versuche es erneut.");
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
            <p>Löschen</p>
          </TooltipContent>
        </Tooltip>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Todo permanent löschen?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              Das Todo "{todo.title}" wird{" "}
              <span className="text-red-400 font-semibold">
                permanent gelöscht
              </span>
              . Diese Aktion kann nicht rückgängig gemacht werden. Das Todo wird
              auch aus deinen Statistiken und Achievements entfernt und aus
              deinem Google Account gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 text-slate-300 hover:bg-slate-600">
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePermanentDelete}
              disabled={isDeleting}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
            >
              {isDeleting ? "Lösche..." : "Permanent löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
