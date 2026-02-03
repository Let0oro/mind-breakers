-- Ensure table exists (in case it wasn't tracked)
CREATE TABLE IF NOT EXISTS notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  type text NOT NULL,
  link text,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Read: Users can see their own notifications
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
CREATE POLICY "Users can read own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

-- 2. Update: Users can mark their own notifications as read
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id);

-- 3. Insert: Allow authenticated users to insert notifications (Service/Admin/Social)
-- This allows:
-- - Admins to notify users
-- - Users to notify others (social actions)
DROP POLICY IF EXISTS "Authenticated can insert notifications" ON notifications;
CREATE POLICY "Authenticated can insert notifications"
ON notifications FOR INSERT
WITH CHECK (auth.role() = 'authenticated');
