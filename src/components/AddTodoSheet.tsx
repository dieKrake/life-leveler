// src/components/AddTodoSheet.tsx
"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import AddTodoForm from "./AddTodoForm";
import type { Todo } from "@/types";
import { KeyedMutator } from "swr";

type AddTodoSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  todos: Todo[] | undefined;
  mutate: KeyedMutator<Todo[]>;
};

export default function AddTodoSheet({
  open,
  onOpenChange,
  todos,
  mutate,
}: AddTodoSheetProps) {
  const handleSuccess = (newTodo: Todo) => {
    // Optimistisches Update: Füge das neue Todo sofort zur Liste hinzu
    // und sortiere die Liste nach start_time
    if (todos) {
      const updatedTodos = [...todos, newTodo].sort((a, b) => {
        const dateA = new Date(a.start_time);
        const dateB = new Date(b.start_time);
        return dateA.getTime() - dateB.getTime();
      });
      mutate(updatedTodos, false);
    } else {
      mutate([newTodo], false);
    }
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 border-slate-700/50 backdrop-blur-sm">
        <SheetHeader className="space-y-3 pb-6">
          <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Neues Todo erstellen
          </SheetTitle>
          <SheetDescription className="text-slate-300 text-base">
            Fülle die Details aus. Dein neuer Eintrag wird direkt mit Google
            synchronisiert und bringt dir XP für dein Level-System.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <AddTodoForm onSuccess={handleSuccess} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
