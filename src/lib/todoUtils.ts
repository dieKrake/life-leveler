import { Todo } from "@/types";

export function getTodoTimingColor(todo: Todo): string {
  if (todo.is_completed) {
    return "bg-gradient-to-br from-slate-800/60 to-slate-900/50 border-green-700/30 border";
  }

  const now = new Date();
  const endTime = new Date(todo.end_time);

  // Get dates without time for proper day comparison
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endDate = new Date(
    endTime.getFullYear(),
    endTime.getMonth(),
    endTime.getDate()
  );

  // Calculate days difference based on dates only
  const daysDiff = Math.round(
    (endDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Overdue (past end time) - Subtle red tint
  if (daysDiff < 0) {
    return "bg-gradient-to-br from-slate-800/70 to-red-900/40 border-red-800/30 border";
  }

  // Due today - Subtle green tint
  if (daysDiff === 0) {
    return "bg-gradient-to-br from-slate-800/70 to-green-900/40 border-green-800/30 border";
  }

  // Due tomorrow - Subtle yellow tint
  if (daysDiff === 1) {
    return "bg-gradient-to-br from-slate-800/70 to-yellow-900/40 border-yellow-800/30 border";
  }

  // Future (more than a week) - Subtle purple tint
  return "bg-gradient-to-br from-slate-800/70 to-purple-900/40 border-purple-800/30 border";
}

export function getTodoTimingBadge(
  todo: Todo
): { text: string; className: string } | null {
  // Always return null to remove all timing badges
  return null;
}
