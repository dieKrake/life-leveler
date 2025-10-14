"use client";

import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { checkSession } from "@/lib/authUtils";
import { toast } from "sonner";
import { motion } from "framer-motion";

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
  const router = useRouter();

  const handleAddTodo = async () => {
    const { valid } = await checkSession();

    if (!valid) {
      toast.error("Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.");
      router.push("/auth/logout");
      return;
    }

    onAddTodo();
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h1 className="text-3xl font-bold text-white">Meine Aufgaben</h1>
        <p className="text-slate-400 mt-1">
          Verwalte deine Todos und sammle XP durch das Erledigen von Aufgaben
        </p>
      </motion.div>

      <motion.div 
        className="flex flex-col sm:flex-row gap-2"
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            onClick={handleAddTodo}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Todo hinzufügen
          </Button>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
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
        </motion.div>
      </motion.div>
    </div>
  );
}
