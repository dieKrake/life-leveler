import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { Todo } from "@/types";
import DifficultyBadge from "@/components/common/DifficultyBadge";

interface DashboardTodoItemProps {
  todo: Todo;
  index: number;
}

export default function DashboardTodoItem({ todo, index }: DashboardTodoItemProps) {
  return (
    <motion.div
      key={todo.id}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 + index * 0.1 }}
      className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
        todo.is_completed
          ? "bg-green-500/10 border-green-500/30 text-green-100"
          : "bg-slate-700/50 border-slate-600 text-slate-200 hover:bg-slate-700"
      }`}
    >
      <div
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
          todo.is_completed
            ? "bg-green-500 border-green-500"
            : "border-slate-400"
        }`}
      >
        {todo.is_completed && <CheckCircle2 className="w-3 h-3 text-white" />}
      </div>
      <div className="flex-1">
        <div className={`font-medium ${todo.is_completed ? "line-through" : ""}`}>
          {todo.title}
        </div>
        <div className="text-xs text-slate-400">{todo.xp_value} XP</div>
      </div>
      <DifficultyBadge xpValue={todo.xp_value} />
    </motion.div>
  );
}
