"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { Todo } from "@/types";

interface DifficultySelectorProps {
  todo: Todo;
  onDifficultyChange: (todoId: number, newXpValue: number) => Promise<void>;
  disabled?: boolean;
}

const difficultyOptions = [
  { value: 10, label: "Einfach", color: "text-green-600" },
  { value: 20, label: "Mittel", color: "text-yellow-600" },
  { value: 30, label: "Schwer", color: "text-red-600" },
];

export function DifficultySelector({
  todo,
  onDifficultyChange,
  disabled = false,
}: DifficultySelectorProps) {
  const [isLoading, setIsLoading] = useState(false);

  const currentDifficulty =
    difficultyOptions.find((option) => option.value === todo.xp_value) ||
    difficultyOptions[0];

  const handleDifficultyChange = async (newXpValue: number) => {
    if (newXpValue === todo.xp_value || isLoading) return;

    setIsLoading(true);
    try {
      await onDifficultyChange(todo.id, newXpValue);
    } catch (error) {
      console.error("Fehler beim Ändern der Schwierigkeit:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (todo.is_completed || disabled) {
    return (
      <span className={`text-xs font-medium ${currentDifficulty.color}`}>
        {currentDifficulty.label}
      </span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 px-2 text-xs font-medium ${currentDifficulty.color} hover:bg-muted`}
          disabled={isLoading}
        >
          {currentDifficulty.label}
          <ChevronDown className="ml-1 h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        {difficultyOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleDifficultyChange(option.value)}
            className={`${option.color} ${
              option.value === todo.xp_value ? "bg-muted" : ""
            }`}
          >
            <span className="flex justify-between items-center w-full">
              {option.label}
              <span className="text-xs text-muted-foreground">
                {option.value} XP
              </span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
