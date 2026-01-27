// Tipos base
export interface Profile {
  id: string
  username: string
  level: number
  total_xp: number
  created_at: string
}

export interface Organization {
  id: string
  name: string
  description?: string
  website_url?: string
}

// Tipos de curso y ejercicios
export interface CourseExercise {
  id: string
  course_id: string
  title: string
  description?: string
  requirements?: string
  created_at: string
}

export interface UserCourseProgress {
  id: string
  user_id: string
  course_id: string
  completed: boolean
  completed_at?: string
  xp_earned: number
}

export interface Course {
  id: string
  path_id: string
  title: string
  summary?: string
  description?: string
  link_url?: string
  thumbnail_url?: string
  organization_id?: string
  order_index: number
  xp_reward: number
  created_at: string
  organizations?: Organization
  course_exercises?: CourseExercise[]
  user_course_progress?: UserCourseProgress[]
}

export interface LearningPath {
  id: string
  title: string
  summary?: string
  description?: string
  author_id?: string
  created_by: string
  created_at: string
  organizations?: Organization
  courses?: Course[]
}

// Tipos específicos para queries con relaciones - CORREGIDOS
export interface SavedPathItem {
  path_id: string
  learning_paths: {
    id: string
    title: string
    summary?: string
    created_at: string
    organizations: {
      name: string
    } | null
  }
}

export interface RecentProgressItem {
  id: string
  user_id: string
  course_id: string
  completed: boolean
  completed_at?: string
  xp_earned: number
  courses: {
    title: string
    learning_paths: {
      title: string
    } | null
  }
}

export interface ExerciseSubmission {
  id: string
  user_id: string
  exercise_id: string
  submission_type: string
  file_path?: string
  drive_url?: string
  submitted_at: string
  status: string
  course_exercises: {
    id: string
    title: string
  }
}

export interface PathWithCourses extends LearningPath {
  courses: Course[]
}

export interface PathListItem {
  id: string
  title: string
  summary?: string
  author_id?: string
  created_by: string
  created_at: string
  organizations?: {
    id: string
    name: string
  }
  courses?: { id: string }[]
  saved_paths?: { user_id: string }[]
}

// Alias para compatibilidad con código anterior
export type SavedPath = SavedPathItem
export type RecentProgress = RecentProgressItem
