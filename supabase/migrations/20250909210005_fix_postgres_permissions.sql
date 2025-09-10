-- Migration: Fix postgres role permissions for auth triggers
-- Created: 2025-09-09 21:00:05

-- Grant all necessary permissions to postgres role (used by auth triggers)
GRANT ALL ON public.player_stats TO postgres;
GRANT ALL ON public.profiles TO postgres;

-- Grant permissions to supabase_auth_admin (auth service role)
GRANT ALL ON public.player_stats TO supabase_auth_admin;
GRANT ALL ON public.profiles TO supabase_auth_admin;

-- Grant permissions to anon and authenticated roles
GRANT INSERT, SELECT, UPDATE ON public.player_stats TO anon, authenticated;
GRANT INSERT, SELECT, UPDATE ON public.profiles TO anon, authenticated;

-- Make sure the functions run with proper privileges
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail auth
    RAISE LOG 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION handle_new_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.player_stats (user_id)
  VALUES (NEW.id);
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail auth
    RAISE LOG 'Failed to create player_stats for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate update_login_streak with better error handling
CREATE OR REPLACE FUNCTION update_login_streak()
RETURNS TRIGGER AS $$
DECLARE
  stats RECORD;
BEGIN
  -- Only proceed if player_stats exists for this user
  SELECT * INTO stats FROM public.player_stats WHERE user_id = NEW.id;
  
  IF FOUND THEN
    IF (stats.last_login IS NULL) OR (stats.last_login::date < NOW()::date) THEN
      IF stats.last_login IS NOT NULL AND stats.last_login::date = (NOW() - INTERVAL '1 day')::date THEN
        UPDATE public.player_stats
        SET 
          current_streak = stats.current_streak + 1,
          last_login = NOW()
        WHERE user_id = NEW.id;
      ELSE
        UPDATE public.player_stats
        SET
          current_streak = 1,
          last_login = NOW()
        WHERE user_id = NEW.id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail auth
    RAISE LOG 'Failed to update login streak for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
