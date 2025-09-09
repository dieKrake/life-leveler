
BEGIN
  INSERT INTO public.player_stats (user_id)
  VALUES (new.id);
  RETURN new;
END;
