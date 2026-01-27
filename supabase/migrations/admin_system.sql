-- ================================================
-- Migration: Admin System and Notifications
-- ================================================
-- Execute this in Supabase SQL Editor or via migration

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

-- Create unique constraint for pending requests
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_requests_user_pending 
ON admin_requests(user_id) 
WHERE status = 'pending';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_requests_status ON admin_requests(status);
CREATE INDEX IF NOT EXISTS idx_admin_requests_user ON admin_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_requests_created ON admin_requests(created_at DESC);

-- 3. Row Level Security Policies
-- ================================================

-- Enable RLS on admin_requests
ALTER TABLE admin_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view own admin requests"
ON admin_requests FOR SELECT
USING (auth.uid() = user_id);

-- Users can create admin requests
CREATE POLICY "Users can create admin requests"
ON admin_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all requests
CREATE POLICY "Admins can view all admin requests"
ON admin_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = TRUE
  )
);

-- Admins can update requests (approve/reject)
CREATE POLICY "Admins can update admin requests"
ON admin_requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = TRUE
  )
);

-- 4. Notifications RLS Policies
-- ================================================

-- Enable RLS on notifications if not already enabled
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON notifications FOR DELETE
USING (auth.uid() = user_id);

-- System/Admins can insert notifications for any user
-- This allows backend to create notifications
CREATE POLICY "System can create notifications"
ON notifications FOR INSERT
WITH CHECK (TRUE);

-- 5. Optional: Make first user admin
-- ================================================
-- Uncomment and replace with your user ID to make yourself admin:
-- UPDATE profiles SET is_admin = TRUE WHERE id = 'YOUR-USER-ID-HERE';

-- Or make admin by email:
-- UPDATE profiles SET is_admin = TRUE 
-- WHERE id IN (SELECT id FROM auth.users WHERE email = 'your-email@example.com');

-- 6. Create helper function to check if user is admin
-- ================================================
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_uuid AND is_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'Remember to set at least one user as admin manually.';
END $$;
