-- Add new columns for course workflow enhancements
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS draft_data JSONB,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS edit_reason TEXT,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Add index/comment if needed
COMMENT ON COLUMN courses.draft_data IS 'Stores pending changes for published courses';
