-- Add status column to courses
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft' 
CHECK (status IN ('draft', 'published', 'archived'));

-- Add is_validated column to courses (Control for Admin)
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS is_validated BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for status and validation
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_is_validated ON courses(is_validated);

-- 1. Row Level Security (RLS) Policies

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- Drop existing policies if they exist to avoid conflicts (based on user error)
DROP POLICY IF EXISTS "Public profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Public profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- User Course Progress
ALTER TABLE user_course_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own progress" ON user_course_progress;
DROP POLICY IF EXISTS "Users insert own progress" ON user_course_progress;
DROP POLICY IF EXISTS "Users update own progress" ON user_course_progress;

CREATE POLICY "Users view own progress" ON user_course_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own progress" ON user_course_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own progress" ON user_course_progress FOR UPDATE USING (auth.uid() = user_id);

-- Courses (Public read if published, otherwise check permissions)
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public published courses" ON courses;
-- Anyone can see published courses
CREATE POLICY "Public published courses" ON courses FOR SELECT USING (status = 'published');

-- 2. Indexes

-- Foreign Keys
CREATE INDEX IF NOT EXISTS idx_courses_path ON courses(path_id);
CREATE INDEX IF NOT EXISTS idx_progress_user ON user_course_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_course ON user_course_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_course_exercises_course ON course_exercises(course_id);

-- Status/Filtering
CREATE INDEX IF NOT EXISTS idx_submissions_status ON exercise_submissions(status);
CREATE INDEX IF NOT EXISTS idx_edit_requests_status ON edit_requests(status);

-- 3. Triggers for updated_at
CREATE EXTENSION IF NOT EXISTS moddatetime;

-- Check if trigger exists before creating to avoid errors (simplified approach: drop then create)
DROP TRIGGER IF EXISTS handle_updated_at ON profiles;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
