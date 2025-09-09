
DECLARE
  new_total_xp BIGINT;
  new_level INT;
  current_level_before_update INT;
  gems_from_level_up INT := 0;
  i INT;
BEGIN
  -- 1. Hole den aktuellen Level, BEVOR die XP geändert werden
  SELECT level INTO current_level_before_update FROM public.player_stats WHERE user_id = auth.uid();

  -- 2. Aktualisiere die Gesamt-XP UND die Juwelen aus der Aufgabe
  -- GREATEST stellt sicher, dass Werte nicht unter 0 fallen
  UPDATE public.player_stats
  SET 
    xp = GREATEST(0, xp + xp_change),
    gems = GREATEST(0, gems + gems_change)
  WHERE user_id = auth.uid()
  RETURNING xp INTO new_total_xp;

  -- 3. Finde das neue Level basierend auf den neuen Gesamt-XP
  SELECT max(level) INTO new_level FROM public.levels
  WHERE xp_required <= new_total_xp;

  -- 4. Prüfe auf Level-Up und berechne Juwelen-Belohnung
  IF new_level > current_level_before_update THEN
    FOR i IN (current_level_before_update + 1)..new_level LOOP
      gems_from_level_up := gems_from_level_up + (i * 10);
    END LOOP;
  END IF;

  -- 5. Aktualisiere den Level UND füge die Juwelen vom Level-Up hinzu
  UPDATE public.player_stats
  SET 
    level = new_level,
    gems = player_stats.gems + gems_from_level_up
  WHERE user_id = auth.uid();
END;
