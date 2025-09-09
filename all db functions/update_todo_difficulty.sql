
DECLARE
  updated_todo RECORD;
BEGIN
  -- Validiere XP-Werte (nur 10, 20, 30 erlaubt)
  IF new_xp_value NOT IN (10, 20, 30) THEN
    RAISE EXCEPTION 'XP-Wert muss 10, 20 oder 30 sein';
  END IF;

  -- Aktualisiere das Todo (nur wenn es dem User gehört und nicht completed ist)
  UPDATE todos 
  SET xp_value = new_xp_value
  WHERE id = todo_id 
    AND todos.user_id = update_todo_difficulty.user_id
    AND is_completed = false
  RETURNING * INTO updated_todo;

  -- Prüfe ob Update erfolgreich war
  IF updated_todo IS NULL THEN
    RAISE EXCEPTION 'Todo nicht gefunden oder bereits abgeschlossen';
  END IF;

  -- Gib das aktualisierte Todo zurück
  RETURN row_to_json(updated_todo);
END;
