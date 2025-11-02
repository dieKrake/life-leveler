/**
 * Utility functions for todo difficulty management
 */

export type Difficulty = "easy" | "medium" | "hard";

export interface DifficultyConfig {
  label: string;
  xpValue: 10 | 20 | 30;
  gemReward: 1 | 2 | 4;
  difficulty: Difficulty;
  colorClass: string;
  bgClass: string;
}

const DIFFICULTY_CONFIGS: Record<10 | 20 | 30, DifficultyConfig> = {
  10: {
    label: "Einfach",
    xpValue: 10,
    gemReward: 1,
    difficulty: "easy",
    colorClass: "text-green-300",
    bgClass: "bg-green-500/20",
  },
  20: {
    label: "Mittel",
    xpValue: 20,
    gemReward: 2,
    difficulty: "medium",
    colorClass: "text-yellow-300",
    bgClass: "bg-yellow-500/20",
  },
  30: {
    label: "Schwer",
    xpValue: 30,
    gemReward: 4,
    difficulty: "hard",
    colorClass: "text-red-300",
    bgClass: "bg-red-500/20",
  },
};

/**
 * Get difficulty configuration for a given XP value
 */
export function getDifficultyConfig(xpValue: number): DifficultyConfig {
  const validXp = [10, 20, 30].includes(xpValue)
    ? (xpValue as 10 | 20 | 30)
    : 10;
  return DIFFICULTY_CONFIGS[validXp];
}

/**
 * Get gem reward for a given XP value
 */
export function getGemReward(xpValue: number): 1 | 2 | 4 {
  return getDifficultyConfig(xpValue).gemReward;
}

/**
 * Get difficulty label for a given XP value
 */
export function getDifficultyLabel(xpValue: number): string {
  return getDifficultyConfig(xpValue).label;
}

/**
 * Get difficulty type for a given XP value
 */
export function getDifficulty(xpValue: number): Difficulty {
  return getDifficultyConfig(xpValue).difficulty;
}
