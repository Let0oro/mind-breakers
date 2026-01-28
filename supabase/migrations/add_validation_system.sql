-- Migration: Add validation system for admin approval
-- Add is_validated column to courses, organizations, and learning_paths

-- Add is_validated column to courses
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_validated BOOLEAN DEFAULT FALSE;

-- Add is_validated column to organizations  
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS is_validated BOOLEAN DEFAULT FALSE;

-- Add is_validated column to learning_paths
ALTER TABLE learning_paths ADD COLUMN IF NOT EXISTS is_validated BOOLEAN DEFAULT FALSE;

-- Mark existing records as validated (so only new items need review)
UPDATE courses SET is_validated = TRUE WHERE is_validated IS NULL OR is_validated = FALSE;
UPDATE organizations SET is_validated = TRUE WHERE is_validated IS NULL OR is_validated = FALSE;
UPDATE learning_paths SET is_validated = TRUE WHERE is_validated IS NULL OR is_validated = FALSE;

-- Create index for faster queries on unvalidated items
CREATE INDEX IF NOT EXISTS idx_courses_unvalidated ON courses(is_validated) WHERE is_validated = FALSE;
CREATE INDEX IF NOT EXISTS idx_organizations_unvalidated ON organizations(is_validated) WHERE is_validated = FALSE;
CREATE INDEX IF NOT EXISTS idx_learning_paths_unvalidated ON learning_paths(is_validated) WHERE is_validated = FALSE;
