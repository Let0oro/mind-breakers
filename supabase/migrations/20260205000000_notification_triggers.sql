-- Helper function to create a notification safely
CREATE OR REPLACE FUNCTION public.create_notification(
  target_user_id uuid,
  title text,
  message text,
  type text,
  link text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (target_user_id, title, message, type, link);
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the transaction
  RAISE WARNING 'Failed to create notification for user %: %', target_user_id, SQLERRM;
END;
$$;

--------------------------------------------------------------------------------
-- 1. SOCIAL: New Follower
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_follower()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  follower_name text;
BEGIN
  -- Get follower username
  SELECT username INTO follower_name FROM public.profiles WHERE id = NEW.follower_id;
  
  PERFORM public.create_notification(
    NEW.following_id,
    'New Follower',
    COALESCE(follower_name, 'Someone') || ' started following you.',
    'new_follower',
    '/dashboard/users/' || NEW.follower_id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_follower ON public.user_follows;
CREATE TRIGGER on_new_follower
AFTER INSERT ON public.user_follows
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_follower();

--------------------------------------------------------------------------------
-- 2. GAMIFICATION: Level Up (Notify Followers)
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_level_up()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  follower_rec record;
BEGIN
  -- Only trigger if level changed and increased
  IF OLD.level IS DISTINCT FROM NEW.level AND NEW.level > OLD.level THEN
    FOR follower_rec IN 
      SELECT follower_id FROM public.user_follows WHERE following_id = NEW.id
    LOOP
      PERFORM public.create_notification(
        follower_rec.follower_id,
        'Level Up!',
        NEW.username || ' reached level ' || NEW.level || '!',
        'social_level_up',
        '/dashboard/users/' || NEW.id
      );
    END LOOP;

    -- Self Notification (Permanent Record)
    PERFORM public.create_notification(
      NEW.id,
      'Level Up!',
      'You reached level ' || NEW.level || '! Keep it up!',
      'level_up',
      '/dashboard/leaderboard'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_level_up ON public.profiles;
CREATE TRIGGER on_level_up
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_level_up();

--------------------------------------------------------------------------------
-- 3. SOCIAL: Course Completion (Notify Followers)
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_course_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_name text;
  course_title text;
  follower_rec record;
BEGIN
  -- Trigger when completed becomes true
  IF OLD.completed IS DISTINCT FROM NEW.completed AND NEW.completed = true THEN
    
    -- Get user name
    SELECT username INTO user_name FROM public.profiles WHERE id = NEW.user_id;
    -- Get course title
    SELECT title INTO course_title FROM public.courses WHERE id = NEW.course_id;

    FOR follower_rec IN 
      SELECT follower_id FROM public.user_follows WHERE following_id = NEW.user_id
    LOOP
      PERFORM public.create_notification(
        follower_rec.follower_id,
        'Friend Activity',
        COALESCE(user_name, 'A friend') || ' completed the course "' || COALESCE(course_title, 'Unknown Course') || '".',
        'social_course_completed',
        '/dashboard/courses/' || NEW.course_id
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_course_completion ON public.user_course_progress;
CREATE TRIGGER on_course_completion
AFTER UPDATE ON public.user_course_progress
FOR EACH ROW
EXECUTE FUNCTION public.handle_course_completion();

--------------------------------------------------------------------------------
-- 4. VALIDATION: Request & Result
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_course_validation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_rec record;
BEGIN
  -- A. New Submission (Status Draft -> Published AND Not Validated)
  IF (OLD.status = 'draft' AND NEW.status = 'published' AND NEW.is_validated = false) THEN
    -- Notify All Admins
    FOR admin_rec IN SELECT id FROM public.profiles WHERE is_admin = true LOOP
      PERFORM public.create_notification(
        admin_rec.id,
        'Validation Request',
        'New course "' || NEW.title || '" requires validation.',
        'validation_request',
        '/dashboard/admin/validations'
      );
    END LOOP;
  END IF;

  -- B. Validation Result (is_validated changed)
  IF OLD.is_validated IS DISTINCT FROM NEW.is_validated THEN
    IF NEW.is_validated = true THEN
      PERFORM public.create_notification(
        NEW.created_by,
        'Course Validated',
        'Your course "' || NEW.title || '" has been approved!',
        'course_approved',
        '/dashboard/courses/' || NEW.id
      );
    ELSIF NEW.is_validated = false AND NEW.status = 'draft' AND OLD.status = 'published' THEN
      -- Assuming rejection sets status back to draft, or uses rejection_reason logic
      -- If specific logic for rejection updates rejection_reason column:
      PERFORM public.create_notification(
        NEW.created_by,
        'Changes Requested',
        'Your course "' || NEW.title || '" needs changes. Check the details.',
        'course_rejected',
        '/dashboard/courses/' || NEW.id || '/edit'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_course_validation ON public.courses;
CREATE TRIGGER on_course_validation
AFTER UPDATE ON public.courses
FOR EACH ROW
EXECUTE FUNCTION public.handle_course_validation();

--------------------------------------------------------------------------------
-- 5. CONTENT: Version Update (Notify Enrolled)
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_course_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  enrolled_rec record;
BEGIN
  -- Trigger if version increases
  IF OLD.version IS DISTINCT FROM NEW.version AND NEW.version > OLD.version THEN
    FOR enrolled_rec IN 
      SELECT user_id FROM public.user_course_progress WHERE course_id = NEW.id
    LOOP
      PERFORM public.create_notification(
        enrolled_rec.user_id,
        'Course Updated',
        'The course "' || NEW.title || '" has new content (v' || NEW.version || ').',
        'course_updated',
        '/dashboard/courses/' || NEW.id
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_course_update ON public.courses;
CREATE TRIGGER on_course_update
AFTER UPDATE ON public.courses
FOR EACH ROW
EXECUTE FUNCTION public.handle_course_update();
