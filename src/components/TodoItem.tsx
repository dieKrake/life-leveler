"use client";

import { useState, useEffect, forwardRef } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Todo } from "@/types";
import useSWR, { KeyedMutator, useSWRConfig } from "swr";
import { PlayerStats } from "@/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatTodoDate } from "@/lib/dateUtils";
import { getTodoTimingColor } from "@/lib/todoUtils";
import { DifficultySelector } from "./DifficultySelector";
import { Flame, Gem } from "lucide-react";
import ArchiveTodoDialog from "./ArchiveTodoDialog";
import { toast } from "sonner";
import { useReward } from "@/components/RewardProvider";
import { motion, AnimatePresence } from "framer-motion";

type TodoItemProps = {
  todo: Todo;
  todos: Todo[] | undefined;
  mutate: KeyedMutator<Todo[]>;
};

const TodoItem = forwardRef<HTMLDivElement, TodoItemProps>(function TodoItem({ todo, todos, mutate }, ref) {
  const supabase = createClientComponentClient();
  const [isChecked, setIsChecked] = useState(todo.is_completed);
  const { mutate: globalMutate } = useSWRConfig();
  const { data: stats, isLoading } = useSWR<PlayerStats>("/api/player-stats");
  const { showTodoReward, showXpLoss, showLevelUpReward, showAchievementUnlockable, showChallengeCompletable } = useReward();

  useEffect(() => {
    setIsChecked(todo.is_completed);
  }, [todo.is_completed]);

  if (!stats) {
    return (
      <div className="w-full bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-lg p-3">
        <div className="text-slate-400">Lade Stats...</div>
      </div>
    );
  }

  const {
    level,
    xp,
    xp_for_current_level,
    xp_for_next_level,
    current_streak,
    streak_multiplier,
  } = stats;

  const handleToggleComplete = async (checked: boolean) => {
    setIsChecked(checked);

    try {
      const response = await fetch("/api/complete-todo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          todoId: todo.id.toString(),
          completed: checked,
        }),
      });

      if (response.status === 401) {
        toast.error(
          "Deine Sitzung ist abgelaufen. Bitte melde dich erneut an."
        );
        // Handle session expiration
        return;
      }

      if (!response.ok) {
        throw new Error("Fehler beim Aktualisieren des Todos");
      }

      const responseData = await response.json();

      // Success - refresh data
      mutate();
      globalMutate("/api/player-stats");
      globalMutate("/api/achievements");
      globalMutate("/api/challenges");

      // Calculate XP and gems for reward notification
      const baseXp = todo.xp_value || 10;
      const baseGems = baseXp === 10 ? 1 : baseXp === 20 ? 2 : 4;
      const finalXp = Math.round(baseXp * streak_multiplier);
      
      // Show reward notification
      if (checked) {
        showTodoReward(finalXp, baseGems, todo.title || undefined);
        
        // Check for level-up and show notification
        if (responseData.levelUp?.level_up) {
          showLevelUpReward(responseData.levelUp.new_level);
        }
        
        // Show notifications for unlockable achievements
        if (responseData.levelUp?.unlockable_achievements?.length > 0) {
          responseData.levelUp.unlockable_achievements.forEach((achievement: any) => {
            showAchievementUnlockable(achievement.reward_gems, achievement.name);
          });
        }
        
        // Show notifications for completed challenges (not yet claimed)
        if (responseData.levelUp?.completed_challenges?.length > 0) {
          responseData.levelUp.completed_challenges.forEach((challenge: any) => {
            showChallengeCompletable(challenge.xp_reward, challenge.gem_reward, challenge.title);
          });
        }
      } else {
        // Show XP loss when unchecking
        showXpLoss(finalXp, baseGems, `"${todo.title || 'Todo'}" rückgängig gemacht`);
      }

      // Success - removed toast notification, using reward notification instead
    } catch (error) {
      console.error("Fehler beim Aktualisieren des Todos:", error);
      setIsChecked(!checked); // Revert checkbox state
      toast.error(
        "Fehler beim Aktualisieren des Todos. Bitte versuche es erneut."
      );
    }
  };

  const handleDifficultyChange = async (todoId: number, newXpValue: number) => {
    try {
      const response = await fetch("/api/update-todo-difficulty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ todoId, xpValue: newXpValue }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Fehler beim Aktualisieren der Schwierigkeit"
        );
      }

      mutate(); // Aktualisiere die Todo-Liste
    } catch (error) {
      console.error("Fehler beim Ändern der Schwierigkeit:", error);
      throw error;
    }
  };

  const todoId = `todo-${todo.id}`;
  const timingColor = getTodoTimingColor(todo);

  return (
    <motion.div
      ref={ref}
      layout
      layoutId={`todo-${todo.id}`}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: isChecked ? 0.98 : 1,
      }}
      exit={{ 
        opacity: 0, 
        y: -20, 
        scale: 0.95,
        transition: { duration: 0.3 }
      }}
      transition={{ 
        duration: 0.4, 
        ease: "easeInOut",
        layout: { duration: 0.3, ease: "easeInOut" }
      }}
      whileHover={{ 
        scale: isChecked ? 0.99 : 1.01,
        transition: { duration: 0.2 }
      }}
      className={`relative p-4 rounded-lg ${timingColor} ${
        isChecked 
          ? 'opacity-75 bg-gradient-to-br from-slate-800/30 to-slate-900/30' 
          : 'opacity-100 hover:shadow-lg hover:shadow-slate-900/20'
      }`}
    >
      <div className="flex items-start space-x-3">
        <Checkbox
          id={todoId}
          checked={isChecked}
          onCheckedChange={handleToggleComplete}
          className="border-blue-400 mt-1 self-start data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 transition-all duration-300"
        />

        <div className="flex-1 space-y-2">
          {/* Title and Badges Row */}
          <div className="flex items-start justify-between gap-3 text-xl">
            <Label
              htmlFor={todoId}
              className={`text-base font-medium leading-relaxed cursor-pointer transition-all duration-300 ${
                isChecked
                  ? "line-through text-slate-400"
                  : "text-white hover:text-slate-200"
              }`}
            >
              {todo.title}
            </Label>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* XP Value Badge */}
              <Badge
                variant="outline"
                className={`text-xs border-purple-500/50 text-purple-300 bg-purple-900/20 transition-all duration-300 ${
                  isChecked ? 'opacity-60 scale-95' : 'opacity-100 scale-100'
                }`}
              >
                <Gem className="w-3 h-3 mr-1" />
                {todo.xp_value} XP
              </Badge>
            </div>
          </div>

          {/* Date and Controls Row */}
          <div className={`flex items-center justify-between transition-all duration-300 ${
            isChecked ? 'opacity-60' : 'opacity-100'
          }`}>
            <p className="text-xs text-slate-400 transition-colors duration-300">
              {formatTodoDate(todo.start_time, todo.end_time)}
            </p>

            <div className="flex items-center gap-3">
              <DifficultySelector
                todo={todo}
                onDifficultyChange={handleDifficultyChange}
              />

              {/* Streak Multiplier */}
              {streak_multiplier > 1.0 && !isChecked && (
                <div className="flex items-center gap-1 animate-pulse">
                  <Flame className="w-3 h-3 text-orange-400 transition-all duration-300" />
                  <span className="text-xs font-semibold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent transition-all duration-300">
                    x{streak_multiplier.toFixed(1)}
                  </span>
                </div>
              )}

              {/* Archive Button - for all todos */}
              <ArchiveTodoDialog todo={todo} todos={todos} mutate={mutate} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default TodoItem;
