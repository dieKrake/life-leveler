import { ReactNode } from "react";
import { KeyedMutator } from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Clock } from "lucide-react";
import TodoItem from "./TodoItem";
import type { Todo } from "@/types";
import { AnimatePresence, motion } from "framer-motion";

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
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, type: "spring", stiffness: 100 }}
    >
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm text-2xl">
        <CardHeader>
          <motion.div 
            className="flex items-center justify-between"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <CardTitle className="flex items-center gap-2 text-white">
              <IconComponent className={`h-5 w-5 ${iconColor}`} />
              {title}
              <motion.span 
                className="ml-2 text-sm font-normal text-slate-400"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                {todos.length}
              </motion.span>
            </CardTitle>
            {headerActions && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
              >
                {headerActions}
              </motion.div>
            )}
          </motion.div>
        </CardHeader>
        <CardContent>
          <motion.div 
            className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.25 }}
          >
            {todos.length > 0 ? (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {todos.map((todo) => (
                    <TodoItem
                      key={todo.id}
                      todo={todo}
                      todos={allTodos}
                      mutate={mutate}
                    />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <motion.div 
                className="text-center py-8"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                {emptyIcon}
                <p className="text-slate-400">{emptyMessage}</p>
              </motion.div>
            )}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
