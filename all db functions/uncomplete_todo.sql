DECLARE
  xp_from_todo INT;
  gems_from_todo INT := 0; -- Variable für die Juwelen der Aufgabe
  streak_multiplier NUMERIC;
  final_xp_to_remove INT;
  user_streak INT;
BEGIN
  -- 1. Hole den XP-Wert aus dem Todo UND setze completed_at auf NULL
  UPDATE public.todos
  SET is_completed = FALSE, completed_at = NULL
  WHERE id = todo_id AND user_id = auth.uid() AND is_completed = TRUE
  RETURNING xp_value INTO xp_from_todo;

  IF xp_from_todo > 0 THEN
    -- 2. NEU: Bestimme die Juwelen, die abgezogen werden sollen
    CASE xp_from_todo
      WHEN 10 THEN gems_from_todo := 1;
      WHEN 20 THEN gems_from_todo := 2;
      WHEN 30 THEN gems_from_todo := 4;
      ELSE gems_from_todo := 0;
    END CASE;

    -- 3. Berechne die abzuziehenden XP (wie bisher)
    SELECT current_streak INTO user_streak FROM public.player_stats WHERE user_id = auth.uid();
    streak_multiplier := public.get_streak_multiplier(user_streak);
    final_xp_to_remove := round(xp_from_todo * streak_multiplier);

    -- 4. Rufe die Master-Funktion auf, die jetzt AUCH die Juwelen abzieht
    PERFORM public.update_player_xp_and_gems(-final_xp_to_remove, -gems_from_todo);
  END IF;
END;