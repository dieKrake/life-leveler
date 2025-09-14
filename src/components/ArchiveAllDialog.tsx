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

interface ArchiveAllDialogProps {
  completedCount: number;
  onArchiveAll: () => void;
  isArchiving: boolean;
}

export default function ArchiveAllDialog({
  completedCount,
  onArchiveAll,
  isArchiving,
}: ArchiveAllDialogProps) {
  if (completedCount === 0) return null;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 text-sm bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-none hover:text-white"
        >
          <Archive className="w-4 h-4" />
          Alle archivieren ({completedCount})
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-slate-800 border-slate-700">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">
            Alle erledigten Todos archivieren?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-300">
            {completedCount} erledigte {completedCount === 1 ? "Todo" : "Todos"}{" "}
            werden aus deiner aktiven Liste entfernt und archiviert. Sie bleiben
            für deine Statistiken und Achievements erhalten, werden aber nicht
            mehr in der normalen Ansicht angezeigt. Die Todos werden auch aus
            deinem Google Account gelöscht.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-slate-700 text-slate-300 hover:bg-slate-600">
            Abbrechen
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onArchiveAll}
            disabled={isArchiving}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {isArchiving ? "Archiviere..." : "Alle archivieren"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
