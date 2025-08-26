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
    // und löse eine Neu-Validierung im Hintergrund aus.
    if (todos) {
      mutate([...todos, newTodo], false);
    } else {
      mutate([newTodo], false);
    }
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Neues Todo erstellen</SheetTitle>
          <SheetDescription>
            Fülle die Details aus. Dein neuer Eintrag wird direkt mit Google
            synchronisiert.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <AddTodoForm onSuccess={handleSuccess} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
