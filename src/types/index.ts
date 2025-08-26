export type Todo = {
  id: number;
  user_id: string;
  google_event_id: string;
  title: string | null;
  start_time: string;
  end_time: string;
  is_completed: boolean;
  created_at: string;
};
