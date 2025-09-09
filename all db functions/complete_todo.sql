DECLARE
  xp_from_todo INT;
  gems_from_todo INT := 0; -- Variable für die Juwelen der Aufgabe
  streak_multiplier NUMERIC;
  final_xp_to_add INT;
  user_streak INT;
BEGIN
  -- 1. Hole den XP-Wert aus dem Todo UND setze completed_at
  UPDATE public.todos
  SET is_completed = TRUE, completed_at = NOW()
  WHERE id = todo_id AND user_id = auth.uid() AND is_completed = FALSE
  RETURNING xp_value INTO xp_from_todo;

  IF xp_from_todo > 0 THEN
    -- 2. NEU: Bestimme die Juwelen-Belohnung basierend auf dem XP-Wert
    CASE xp_from_todo
      WHEN 10 THEN gems_from_todo := 1; -- Easy
      WHEN 20 THEN gems_from_todo := 2; -- Medium
      WHEN 30 THEN gems_from_todo := 4; -- Hard
      ELSE gems_from_todo := 0;
    END CASE;

    -- 3. Hole den Streak und berechne die finalen XP (wie bisher)
    SELECT current_streak INTO user_streak FROM public.player_stats WHERE user_id = auth.uid();
    streak_multiplier := public.get_streak_multiplier(user_streak);
    final_xp_to_add := round(xp_from_todo * streak_multiplier);

    -- 4. Rufe die Master-Funktion auf, die jetzt AUCH die Juwelen hinzufügt
    PERFORM public.update_player_xp_and_gems(final_xp_to_add, gems_from_todo);
  END IF;
END;