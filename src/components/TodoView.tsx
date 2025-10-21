"use client";

import type { Todo } from "@/types";
import { useTodos } from "./UnifiedDataProvider";
import { useMemo, useState } from "react";
import { CheckSquare, Clock } from "lucide-react";
import AddTodoSheet from "./AddTodoSheet";
import TodoViewHeader from "./TodoViewHeader";
import TodoSection from "./TodoSection";
import ArchiveAllDialog from "./ArchiveAllDialog";
import { useTodoOperations } from "@/hooks/useTodoOperations";
import { motion } from "framer-motion";

export default function TodoView() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const {
    data: todos,
    error,
    isLoading,
    mutate,
  } = useTodos();

  const { isSyncing, isArchiving, handleSync, handleArchiveAllCompleted } =
    useTodoOperations(mutate);

  const incompleteTodos = useMemo(
    () => todos?.filter((todo) => !todo.is_completed) || [],
    [todos]
  );

  const completedTodos = useMemo(
    () => todos?.filter((todo) => todo.is_completed) || [],
    [todos]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center text-white">Lade Todos...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center text-red-400">
            Fehler: {error.message}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="container mx-auto max-w-8xl space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <TodoViewHeader
            onAddTodo={() => setIsSheetOpen(true)}
            onSync={handleSync}
            isSyncing={isSyncing}
          />
        </motion.div>

        <AddTodoSheet
          open={isSheetOpen}
          onOpenChange={setIsSheetOpen}
          todos={todos}
          mutate={mutate}
        />

        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <TodoSection
              title="Offene Aufgaben"
              icon="clock"
              iconColor="text-blue-400"
              todos={incompleteTodos}
              allTodos={todos}
              mutate={mutate}
              emptyMessage="Super! Keine offenen Aufgaben."
              emptyIcon={
                <CheckSquare className="h-12 w-12 text-slate-600 mx-auto mb-3" />
              }
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <TodoSection
              title="Erledigte Aufgaben"
              icon="checkSquare"
              iconColor="text-green-400"
              todos={completedTodos}
              allTodos={todos}
              mutate={mutate}
              emptyMessage="Noch keine Aufgaben erledigt."
              emptyIcon={
                <Clock className="h-12 w-12 text-slate-600 mx-auto mb-3" />
              }
              headerActions={
                <ArchiveAllDialog
                  completedCount={completedTodos.length}
                  onArchiveAll={handleArchiveAllCompleted}
                  isArchiving={isArchiving}
                />
              }
            />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
