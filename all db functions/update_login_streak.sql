DECLARE
  stats RECORD;
BEGIN
  -- Hole die aktuellen Streak-Daten des Nutzers, der sich gerade einloggt
  SELECT * INTO stats FROM public.player_stats WHERE user_id = NEW.id;

  -- Prüfe, ob der letzte Login an einem früheren Tag als heute war
  IF (stats.last_login IS NULL) OR (stats.last_login::date < NOW()::date) THEN
    
    -- Wenn der letzte Login genau gestern war, erhöhe den Streak
    IF stats.last_login IS NOT NULL AND stats.last_login::date = (NOW() - INTERVAL '1 day')::date THEN
      UPDATE public.player_stats
      SET 
        current_streak = stats.current_streak + 1,
        last_login = NOW()  -- Wichtig: NOW() statt NEW.last_sign_in_at
      WHERE user_id = NEW.id;
    ELSE
      -- Ansonsten setze den Streak auf 1
      UPDATE public.player_stats
      SET
        current_streak = 1,
        last_login = NOW()  -- Wichtig: NOW() statt NEW.last_sign_in_at
      WHERE user_id = NEW.id;
    END IF;
    
  END IF;

  RETURN NEW;
END;