-- Usuarios (gestionado por Supabase Auth, solo extends profile)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT UNIQUE,
  level INTEGER DEFAULT 1,
  total_xp INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organizaciones/Autores
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  website_url TEXT
);

-- Paths de aprendizaje
CREATE TABLE learning_paths (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  summary TEXT,
  description TEXT,
  author_id UUID REFERENCES organizations(id),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cursos
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  path_id UUID REFERENCES learning_paths(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  description TEXT,
  link_url TEXT, -- YouTube/web
  thumbnail_url TEXT, -- captura o meta OG
  organization_id UUID REFERENCES organizations(id),
  order_index INTEGER, -- orden en el path
  xp_reward INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ejercicios/Proyectos
CREATE TABLE course_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  requirements TEXT, -- qué debe hacer el usuario
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Progreso del usuario
CREATE TABLE user_course_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  xp_earned INTEGER DEFAULT 0,
  UNIQUE(user_id, course_id)
);

-- Submissions de ejercicios
CREATE TABLE exercise_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  exercise_id UUID REFERENCES course_exercises(id),
  submission_type TEXT, -- 'zip', 'text', 'drive_link', 'github'
  file_path TEXT, -- ruta en Supabase Storage
  drive_url TEXT, -- si usa Google Drive
  github_repo_url TEXT, -- si usa repositorio de GitHub
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending' -- pending, approved, rejected
);

-- Guardados/Favoritos
CREATE TABLE saved_courses (
  user_id UUID REFERENCES profiles(id),
  course_id UUID REFERENCES courses(id),
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, course_id)
);

CREATE TABLE saved_paths (
  user_id UUID REFERENCES profiles(id),
  path_id UUID REFERENCES learning_paths(id),
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, path_id)
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'exercise_approved', 'exercise_rejected', 'level_up', 'achievement'
  link TEXT, -- URL para redirigir al hacer click
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

<!-- Changes post -->


-- 1. Add is_admin field to profiles
-- ================================================
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create index for admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = TRUE;

-- 2. Create admin_requests table
-- ================================================
CREATE TABLE IF NOT EXISTS admin_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id)
);

-- 3. Add avatar_url to profiles and storage bucket
-- ================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create avatars bucket (Run this in Supabase SQL editor or Storage UI)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Policy to allow authenticated users to upload avatars
-- CREATE POLICY "Avatar images are publicly accessible"
--   ON storage.objects FOR SELECT
--   USING ( bucket_id = 'avatars' );

-- CREATE POLICY "Anyone can upload an avatar"
--   ON storage.objects FOR INSERT
--   WITH CHECK ( bucket_id = 'avatars' );
  
-- CREATE POLICY "Anyone can update their own avatar"
--   ON storage.objects FOR UPDATE
--   USING ( auth.uid() = owner )
--   WITH CHECK ( bucket_id = 'avatars' );