import { ReactNode } from "react";
import { KeyedMutator } from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Clock } from "lucide-react";
import TodoItem from "./TodoItem";
import type { Todo } from "@/types";

interface TodoSectionProps {
  title: string;
  icon: "clock" | "checkSquare";
  iconColor: string;
  todos: Todo[];
  allTodos: Todo[] | undefined;
  mutate: KeyedMutator<Todo[]>;
  emptyMessage: string;
  emptyIcon: ReactNode;
  headerActions?: ReactNode;
}

export default function TodoSection({
  title,
  icon,
  iconColor,
  todos,
  allTodos,
  mutate,
  emptyMessage,
  emptyIcon,
  headerActions,
}: TodoSectionProps) {
  const IconComponent = icon === "clock" ? Clock : CheckSquare;

  return (
    <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm text-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <IconComponent className={`h-5 w-5 ${iconColor}`} />
            {title}
            <span className="ml-2 text-sm font-normal text-slate-400">
              {todos.length}
            </span>
          </CardTitle>
          {headerActions}
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {todos.length > 0 ? (
            <div className="space-y-3">
              {todos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  todos={allTodos}
                  mutate={mutate}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              {emptyIcon}
              <p className="text-slate-400">{emptyMessage}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
