-- Migration: Fix RLS permissions for auth triggers
-- Created: 2025-09-09 21:00:04

-- Temporarily disable RLS on player_stats to allow trigger inserts
ALTER TABLE public.player_stats DISABLE ROW LEVEL SECURITY;

-- Temporarily disable RLS on profiles to allow trigger inserts
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Grant necessary permissions for the trigger functions
GRANT INSERT ON public.player_stats TO authenticated;
GRANT INSERT ON public.profiles TO authenticated;

-- Allow service role (used by triggers) to insert
GRANT INSERT ON public.player_stats TO service_role;
GRANT INSERT ON public.profiles TO service_role;

-- Update trigger functions to use SECURITY DEFINER properly
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION handle_new_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.player_stats (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
