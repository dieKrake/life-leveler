import { Todo } from "@/types";

export function getTodoTimingColor(todo: Todo): string {
  if (todo.is_completed) {
    return "bg-gradient-to-br from-slate-800/60 to-slate-900/50 border-green-700/30 border";
  }

  const now = new Date();
  const endTime = new Date(todo.end_time);

  // Calculate days difference
  const daysDiff = Math.ceil(
    (endTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Overdue (past end time) - Subtle red tint
  if (daysDiff < 0) {
    return "bg-gradient-to-br from-slate-800/70 to-red-900/40 border-red-800/30 border";
  }

  // Due today - Subtle orange tint
  if (daysDiff === 0) {
    return "bg-gradient-to-br from-slate-800/70 to-orange-900/40 border-orange-800/30 border";
  }

  // Due tomorrow - Subtle yellow tint
  if (daysDiff === 1) {
    return "bg-gradient-to-br from-slate-800/70 to-yellow-900/40 border-yellow-800/30 border";
  }

  // Due within 3 days - Subtle blue tint
  if (daysDiff <= 3) {
    return "bg-gradient-to-br from-slate-800/70 to-blue-900/40 border-blue-800/30 border";
  }

  // Due within a week - Subtle cyan tint
  if (daysDiff <= 7) {
    return "bg-gradient-to-br from-slate-800/70 to-cyan-900/40 border-cyan-800/30 border";
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
