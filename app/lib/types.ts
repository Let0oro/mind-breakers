// Tipos base
export interface Profile {
  id: string
  username: string
  level: number
  total_xp: number
  is_admin: boolean
  created_at: string
  avatar_url?: string | null
  bio?: string | null
  social_links?: {
    twitter?: string
    linkedin?: string
    github?: string
    website?: string
  } | null
  // featured_content?: any[] 
}

export interface ExpeditionOwner {
  id: string
  expedition_id: string
  user_id: string
  created_at: string
}

export interface UserFollow {
  follower_id: string
  following_id: string
  created_at: string
}

export interface Organization {
  id: string
  name: string
  description?: string
  website_url?: string
  is_validated?: boolean
}

// Tipos de curso y ejercicios
export interface QuestExercise {
  id: string
  quest_id: string
  title: string
  description?: string
  requirements?: string
  created_at: string
  uk: string
}

export interface UserQuestProgress {
  id: string
  user_id: string
  quest_id: string
  completed: boolean
  completed_at?: string
  xp_earned: number
}

export interface Quest {
  id: string
  expedition_id: string
  title: string
  summary?: string
  description?: string
  link_url?: string
  thumbnail_url?: string
  organization_id?: string
  order_index: number
  xp_reward: number
  created_at: string
  is_validated?: boolean
  version: number
  draft_data?: Record<string, unknown> | null
  rejection_reason?: string | null
  edit_reason?: string | null
  archived_at?: string | null
  status?: 'draft' | 'published' | 'archived'
  organizations?: Organization
  quest_exercises?: QuestExercise[]
  user_quest_progress?: UserQuestProgress[]
  uk: string
}

export interface Expedition {
  id: string
  title: string
  summary?: string
  description?: string
  author_id?: string
  created_by: string
  created_at: string
  is_validated?: boolean
  organizations?: Organization
  quests?: Quest[]
  uk: string
}

// Edit Request Type for Admin Validations
export interface EditRequest {
  id: string
  resource_type: 'quests' | 'expeditions' | 'organizations'
  resource_id: string
  data: Record<string, unknown>
  reason: string | null
  created_at: string
  user?: { email: string }
  resource_title?: string
  status: string
}

// Tipos específicos para queries con relaciones - CORREGIDOS
export interface SavedExpeditionItem {
  expedition_id: string
  expeditions: {
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
  quest_id: string
  completed: boolean
  completed_at?: string
  xp_earned: number
  quests: {
    title: string
    expeditions: {
      title: string
    } | null
  }
}

export interface ExerciseSubmission {
  id: string
  user_id: string
  exercise_id: string
  submission_type: string
  file_expedition?: string
  drive_url?: string
  github_repo_url?: string
  submitted_at: string
  status: string
  quest_exercises: {
    id: string
    title: string
  }
}

export interface ExpeditionWithQuests extends Expedition {
  quests: Quest[]
}

export interface ExpeditionListItem {
  id: string
  title: string
  summary?: string
  description?: string
  created_by?: string
  created_at: string
  is_validated?: boolean
  organizations?: {
    id: string
    name: string
  } | Array<{
    id: string
    name: string
  }> | null
  quests?: Array<{ id: string }>
  saved_expeditions?: Array<{ user_id: string }>
}

// Alias para compatibilidad con código anterior
export type SavedExpedition = SavedExpeditionItem
export type RecentProgress = RecentProgressItem

// Tipos para breadcrumbs
export interface BreadcrumbItem {
  label: string
  href?: string
  icon?: string
}

export interface BreadcrumbProps {
  items?: BreadcrumbItem[]
  autoGenerate?: boolean
}

// Admin system types
export interface AdminRequest {
  id: string
  user_id: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  reviewed_at?: string
  reviewed_by?: string
  profiles?: Profile  // User who requested
  reviewer?: Profile  // Admin who reviewed
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'exercise_approved' | 'exercise_rejected' | 'level_up' | 'achievement' | 'admin_request_approved' | 'admin_request_rejected' | 'new_admin_request'
  link?: string
  read: boolean
  created_at: string
  expires_at: string
}

export interface ExpeditionResource {
  id: string
  expedition_id: string
  user_id: string | null
  title: string
  type: 'link' | 'text'
  content: string
  created_at: string
  profiles?: {
    username: string
    avatar_url: string
  }
}
