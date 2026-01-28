-- ================================================
-- Migration: Backfill profiles for existing auth.users
-- ================================================
-- Run this ONCE to create profiles for users that existed before the trigger was installed

-- Insert profiles for all auth.users that don't have a profile yet
INSERT INTO public.profiles (id, username, avatar_url, level, total_xp, created_at)
SELECT 
  au.id,
  COALESCE(
    au.raw_user_meta_data->>'full_name', 
    au.raw_user_meta_data->>'name', 
    au.raw_user_meta_data->>'user_name',
    SPLIT_PART(au.email, '@', 1)  -- Use email prefix as fallback username
  ) AS username,
  au.raw_user_meta_data->>'avatar_url' AS avatar_url,
  1 AS level,
  0 AS total_xp,
  au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Show results
DO $$
DECLARE
  profiles_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO profiles_count FROM public.profiles;
  RAISE NOTICE 'Backfill complete. Total profiles: %', profiles_count;
END $$;
