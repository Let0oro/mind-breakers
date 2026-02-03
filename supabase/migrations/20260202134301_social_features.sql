-- 1. Extend Profiles Table
ALTER TABLE profiles 
ADD COLUMN bio text,
ADD COLUMN social_links jsonb DEFAULT '{}'::jsonb,
ADD COLUMN featured_content jsonb DEFAULT '[]'::jsonb;

-- 2. Create Path Co-Ownership Table
CREATE TABLE path_owners (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  path_id uuid REFERENCES learning_paths(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(path_id, user_id)
);

-- 3. Create Follows Table
CREATE TABLE user_follows (
  follower_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (follower_id, following_id)
);

-- Enable RLS (Row Level Security)
ALTER TABLE path_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- Postgrest automatically exposes these tables, but we should add policies
-- Policy for path_owners:
-- 1. Admins can do anything (assuming is_admin check exists or service role)
-- 2. Path creators can add owners
-- 3. Owners can view themselves
-- For now, kept simple/public readable for dev:
CREATE POLICY "Enable read access for all users" ON path_owners FOR SELECT USING (true);
CREATE POLICY "Enable insert for valid users" ON path_owners FOR INSERT WITH CHECK (auth.uid() = user_id); 

-- Policies for user_follows
CREATE POLICY "Everyone can read follows" ON user_follows FOR SELECT USING (true);
CREATE POLICY "Users can follow others" ON user_follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON user_follows FOR DELETE USING (auth.uid() = follower_id);
