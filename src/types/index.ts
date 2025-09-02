export type Todo = {
  id: number;
  user_id: string;
  google_event_id: string;
  title: string | null;
  start_time: string;
  end_time: string;
  is_completed: boolean;
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
};
