-- Create path_resources table
CREATE TABLE path_resources (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    path_id uuid REFERENCES learning_paths(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES profiles(id) ON DELETE SET NULL, -- specific user who added it
    title text NOT NULL,
    type text CHECK (type IN ('link', 'text')) NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX idx_path_resources_path_id ON path_resources(path_id);
CREATE INDEX idx_path_resources_user_id ON path_resources(user_id);

-- Enable RLS
ALTER TABLE path_resources ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Everyone can view resources
CREATE POLICY "Everyone can view path resources" 
ON path_resources FOR SELECT 
USING (true);

-- 2. Authenticated users can insert resources
CREATE POLICY "Authenticated users can insert path resources" 
ON path_resources FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 3. Users can delete their own resources
CREATE POLICY "Users can delete their own path resources" 
ON path_resources FOR DELETE 
USING (auth.uid() = user_id);

-- 4. Admins can delete any resource (assuming exists function or similar admin check, otherwise manual policy)
-- Using a subquery to check if the user is an admin from profiles table
CREATE POLICY "Admins can delete any path resource" 
ON path_resources FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);
