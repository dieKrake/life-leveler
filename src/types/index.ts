export type Todo = {
  id: number;
  user_id: string;
  google_event_id: string;
  title: string | null;
  start_time: string;
  end_time: string;
  is_completed: boolean;
  completed_at: string | null;
  archived_at: string | null;
  created_at: string;
  xp_value: number;
};

export type PlayerStats = {
  xp: number;
  level: number;
  xp_for_current_level: number;
  xp_for_next_level: number | null;
  current_streak: number;
  streak_multiplier: number;
  gems: number;
  prestige: number;
  max_level_reached: number;
  can_prestige?: boolean;
};

export type TodoStats = {
  totalTodos: number;
  completedTodos: number;
  completedTodosWithTimestamps: number;
  currentStreak: number;
  highestStreak: number;
  totalXP: number;
  totalGems: number;
  productiveHour: string;
  dailyCompletions: Array<{
    day: string;
    completed: number;
    target: number;
  }>;
  weeklyTrend: Array<{
    week: string;
    todos: number;
  }>;
  difficultyDistribution: Array<{
    difficulty: string;
    count: number;
    xp: number;
    color: string;
  }>;
  hourlyActivity: Array<{
    hour: string;
    count: number;
  }>;
};

export type StreakMultiplier = {
  id: number;
  min_streak_days: number;
  multiplier: number;
  created_at: string;
};

export type Achievement = {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: "streak" | "xp" | "gems" | "level" | "tasks";
  condition_type: "reach_value" | "complete_count" | "streak_days";
  condition_value: number;
  reward_gems: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type UserAchievement = {
  achievement_id: number;
  name: string;
  description: string;
  icon: string;
  category: "streak" | "xp" | "gems" | "level" | "tasks";
  condition_value: number;
  reward_gems: number;
  sort_order: number;
  is_unlocked: boolean;
  current_progress: number;
  progress_percentage: number;
  unlocked_at: string | null;
};

export type ChallengeType = "daily" | "weekly";

export type ChallengeConditionType =
  | "complete_count"
  | "complete_before_time"
  | "complete_difficulty"
  | "earn_xp";

export interface Challenge {
  id: string;
  challenge_id: string;
  title: string;
  description: string;
  type: ChallengeType;
  progress: number;
  target: number;
  xp_reward: number;
  gem_reward: number;
  completed: boolean;
  claimed: boolean;
  expires_at: string;
  time_left: string;
}

export interface ChallengesResponse {
  daily: Challenge[];
  weekly: Challenge[];
}

export interface ChallengeCompletion {
  id: string;
  user_id: string;
  challenge_id: string;
  completed_at: string;
  xp_earned: number;
  gems_earned: number;
  challenges: {
    title: string;
    description: string;
    type: ChallengeType;
  };
}
