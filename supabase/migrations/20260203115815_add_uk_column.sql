-- Add uk (Effective Unique Key) column to main tables
-- This key helps track "forks" or adaptations of content across different paths

-- 1. Add uk column to learning_paths
ALTER TABLE learning_paths 
ADD COLUMN uk uuid DEFAULT gen_random_uuid() NOT NULL;

CREATE INDEX idx_learning_paths_uk ON learning_paths(uk);

-- 2. Add uk column to courses
ALTER TABLE courses 
ADD COLUMN uk uuid DEFAULT gen_random_uuid() NOT NULL;

CREATE INDEX idx_courses_uk ON courses(uk);

-- 3. Add uk column to course_exercises
ALTER TABLE course_exercises 
ADD COLUMN uk uuid DEFAULT gen_random_uuid() NOT NULL;

CREATE INDEX idx_course_exercises_uk ON course_exercises(uk);
