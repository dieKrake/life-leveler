import { Todo } from "@/types";

export function getTodoTimingColor(todo: Todo): string {
  if (todo.is_completed) {
    return "bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-700/50";
  }

  const now = new Date();
  const endTime = new Date(todo.end_time);
  const startTime = new Date(todo.start_time);

  // Calculate days difference
  const daysDiff = Math.ceil(
    (endTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Overdue (past end time)
  if (daysDiff < 0) {
    return "bg-gradient-to-br from-red-900/30 to-red-800/20 border-red-700/50";
  }

  // Due today
  if (daysDiff === 0) {
    return "bg-gradient-to-br from-orange-900/30 to-amber-900/20 border-orange-700/50";
  }

  // Due tomorrow
  if (daysDiff === 1) {
    return "bg-gradient-to-br from-yellow-900/20 to-amber-900/20 border-yellow-700/50";
  }

  // Due within 3 days
  if (daysDiff <= 3) {
    return "bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border-blue-700/50";
  }

  // Due within a week
  if (daysDiff <= 7) {
    return "bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50";
  }

  // Future (more than a week)
  return "bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border-purple-700/50";
}

export function getTodoTimingBadge(
  todo: Todo
): { text: string; className: string } | null {
  if (todo.is_completed) {
    return { text: "Erledigt", className: "bg-green-600 text-white" };
  }

  const now = new Date();
  const endTime = new Date(todo.end_time);
  const daysDiff = Math.ceil(
    (endTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDiff < 0) {
    const overdueDays = Math.abs(daysDiff);
    return {
      text: `${overdueDays} Tag${overdueDays > 1 ? "e" : ""} überfällig`,
      className: "bg-red-600 text-white animate-pulse",
    };
  }

  if (daysDiff === 0) {
    return { text: "Heute fällig", className: "bg-orange-600 text-white" };
  }

  if (daysDiff === 1) {
    return { text: "Morgen fällig", className: "bg-yellow-600 text-white" };
  }

  if (daysDiff <= 3) {
    return {
      text: `In ${daysDiff} Tagen`,
      className: "bg-blue-600 text-white",
    };
  }

  return null; // No badge for items due later
}
