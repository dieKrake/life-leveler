import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";

interface TodoViewHeaderProps {
  onAddTodo: () => void;
  onSync: () => void;
  isSyncing: boolean;
}

export default function TodoViewHeader({
  onAddTodo,
  onSync,
  isSyncing,
}: TodoViewHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold text-white">Meine Aufgaben</h1>
        <p className="text-slate-400 mt-1">
          Verwalte deine Todos und sammle XP durch das Erledigen von Aufgaben
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          onClick={onAddTodo}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Todo hinzufügen
        </Button>
        <Button
          onClick={onSync}
          disabled={isSyncing}
          variant="outline"
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-none hover:text-white"
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${isSyncing ? "animate-spin" : ""}`}
          />
          {isSyncing ? "Synchronisiere..." : "Google Sync"}
        </Button>
      </div>
    </div>
  );
}
