-- Migration: Restore original auth functions exactly as they were
-- Created: 2025-09-09 21:00:03

-- Drop existing triggers first
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_stats ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;

-- Original handle_new_user function (simple version)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Original handle_new_user_stats function (simple version)
CREATE OR REPLACE FUNCTION handle_new_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.player_stats (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Original update_login_streak function
CREATE OR REPLACE FUNCTION update_login_streak()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create the original triggers
CREATE TRIGGER on_auth_user_created_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER on_auth_user_created_stats
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user_stats();

CREATE TRIGGER on_auth_user_login
    AFTER UPDATE OF last_sign_in_at ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION update_login_streak();
