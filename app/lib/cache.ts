/**
 * Server-side cached queries using Next.js unstable_cache
 * These functions cache database results and can be invalidated with tags
 */

import { unstable_cache } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { PathListItem } from './types'
import type { CourseListItem, OrganizationListItem, DraftItem } from './queries'

// Re-export types with Quest naming
export type { CourseListItem as QuestListItem }

// Cache durations (in seconds)
const CACHE_DURATION = {
    SHORT: 60,        // 1 minute - for frequently changing data
    MEDIUM: 300,      // 5 minutes - for moderately changing data
    LONG: 3600,       // 1 hour - for rarely changing data
}

// ============================================================================
// Cache Tags - use these to invalidate specific caches
// ============================================================================

export const CACHE_TAGS = {
    QUESTS: 'courses',
    PATHS: 'paths',
    ORGANIZATIONS: 'organizations',
    USER_PROGRESS: 'user-progress',
    USER_SAVED: 'user-saved',
    EXERCISES: 'exercises',
    SUBMISSIONS: 'submissions',
    ADMIN: 'admin',
} as const

// ============================================================================
// Cached Quest Queries
// ============================================================================

/**
 * Get published and validated quests (cached)
 */
export const getPublishedQuestsCached = (supabase: SupabaseClient, limit?: number) =>
    unstable_cache(
        async () => {
            const query = supabase
                .from('courses')
                .select(`
                    id,
                    title,
                    summary,
                    thumbnail_url,
                    xp_reward,
                    is_validated,
                    created_by,
                    status,
                    organizations (name)
                `)
                .eq('status', 'published')
                .eq('is_validated', true)
                .order('created_at', { ascending: false })

            if (limit) {
                query.limit(limit)
            }

            const { data } = await query
            return (data as unknown as CourseListItem[]) || []
        },
        [`published-quests-${limit || 'all'}`],
        {
            revalidate: CACHE_DURATION.MEDIUM,
            tags: [CACHE_TAGS.QUESTS],
        }
    )()

/**
 * Get a single quest by ID (cached) - basic version
 */
export const getQuestCached = (supabase: SupabaseClient, questId: string) =>
    unstable_cache(
        async () => {
            const { data } = await supabase
                .from('courses')
                .select(`
                    *,
                    organizations (id, name),
                    course_exercises (id, title, description)
                `)
                .eq('id', questId)
                .single()

            return data
        },
        [`quest-${questId}`],
        {
            revalidate: CACHE_DURATION.MEDIUM,
            tags: [CACHE_TAGS.QUESTS, `quest-${questId}`],
        }
    )()

/**
 * Get quest detail with full data for detail page (cached)
 */
export const getQuestDetailCached = (supabase: SupabaseClient, questId: string) =>
    unstable_cache(
        async () => {
            const { data, error } = await supabase
                .from('courses')
                .select(`
                    *,
                    learning_paths (id, title),
                    organizations (name, website_url),
                    course_exercises (*)
                `)
                .eq('id', questId)
                .single()

            return { data, error }
        },
        [`quest-detail-${questId}`],
        {
            revalidate: CACHE_DURATION.MEDIUM,
            tags: [CACHE_TAGS.QUESTS, `quest-${questId}`],
        }
    )()

/**
 * Get user's course progress for a specific course (cached per user)
 */
export const getUserCourseProgressCached = (supabase: SupabaseClient, userId: string, courseId: string) =>
    unstable_cache(
        async () => {
            const { data } = await supabase
                .from('user_course_progress')
                .select('id, completed, completed_at, xp_earned')
                .eq('user_id', userId)
                .eq('course_id', courseId)
                .single()

            return data
        },
        [`user-course-progress-${userId}-${courseId}`],
        {
            revalidate: CACHE_DURATION.SHORT,
            tags: [CACHE_TAGS.USER_PROGRESS, `user-${userId}`, `quest-${courseId}`],
        }
    )()

/**
 * Get user's exercise submissions for a course (cached per user)
 */
export const getUserExerciseSubmissionsCached = (supabase: SupabaseClient, userId: string, exerciseIds: string[]) =>
    unstable_cache(
        async () => {
            if (exerciseIds.length === 0) return []

            const { data } = await supabase
                .from('exercise_submissions')
                .select('*, course_exercises (*)')
                .eq('user_id', userId)
                .in('exercise_id', exerciseIds)

            return data || []
        },
        [`user-submissions-${userId}-${exerciseIds.sort().join('-')}`],
        {
            revalidate: CACHE_DURATION.SHORT,
            tags: [CACHE_TAGS.SUBMISSIONS, `user-${userId}`],
        }
    )()

/**
 * Check if user has saved a course (cached per user)
 */
export const isCourseSavedCached = (supabase: SupabaseClient, userId: string, courseId: string) =>
    unstable_cache(
        async () => {
            const { data } = await supabase
                .from('saved_courses')
                .select('id')
                .eq('user_id', userId)
                .eq('course_id', courseId)
                .single()

            return !!data
        },
        [`course-saved-${userId}-${courseId}`],
        {
            revalidate: CACHE_DURATION.SHORT,
            tags: [CACHE_TAGS.USER_SAVED, `user-${userId}`, `quest-${courseId}`],
        }
    )()

/**
 * Get IDs of quests created by user (cached per user)
 */
export const getUserCreatedQuestIdsCached = (supabase: SupabaseClient, userId: string) =>
    unstable_cache(
        async () => {
            const { data } = await supabase
                .from('courses')
                .select('id')
                .eq('created_by', userId)

            return data?.map(c => c.id) || []
        },
        [`user-created-quests-${userId}`],
        {
            revalidate: CACHE_DURATION.SHORT,
            tags: [CACHE_TAGS.QUESTS, `user-${userId}`],
        }
    )()

/**
 * Get quests by an array of IDs with full details (cached)
 */
export const getQuestsByIdsCached = (supabase: SupabaseClient, questIds: string[]) =>
    unstable_cache(
        async () => {
            if (questIds.length === 0) return []

            const { data } = await supabase
                .from('courses')
                .select(`
                    id,
                    title,
                    summary,
                    thumbnail_url,
                    xp_reward,
                    is_validated,
                    created_by,
                    status,
                    organizations (name),
                    user_course_progress (
                        completed,
                        xp_earned
                    ),
                    saved_courses (
                        user_id
                    )
                `)
                .in('id', questIds)
                .order('created_at', { ascending: false })

            return data || []
        },
        [`quests-by-ids-${questIds.sort().join('-')}`],
        {
            revalidate: CACHE_DURATION.SHORT,
            tags: [CACHE_TAGS.QUESTS],
        }
    )()

// ============================================================================
// Cached Path Queries
// ============================================================================

/**
 * Get validated paths (cached)
 */
export const getValidatedPathsCached = (supabase: SupabaseClient, limit?: number) =>
    unstable_cache(
        async () => {
            const query = supabase
                .from('learning_paths')
                .select(`
                    id,
                    title,
                    summary,
                    description,
                    created_at,
                    created_by,
                    is_validated,
                    organizations (id, name),
                    courses (id)
                `)
                .eq('is_validated', true)
                .order('created_at', { ascending: false })

            if (limit) {
                query.limit(limit)
            }

            const { data } = await query
            return (data as PathListItem[]) || []
        },
        [`validated-paths-${limit || 'all'}`],
        {
            revalidate: CACHE_DURATION.MEDIUM,
            tags: [CACHE_TAGS.PATHS],
        }
    )()

/**
 * Get a single path by ID (cached)
 */
export const getPathCached = (supabase: SupabaseClient, pathId: string) =>
    unstable_cache(
        async () => {
            const { data } = await supabase
                .from('learning_paths')
                .select(`
                    *,
                    organizations (id, name),
                    courses (
                        id,
                        title,
                        summary,
                        thumbnail_url,
                        xp_reward,
                        order_index,
                        status,
                        is_validated  
                    )
                `)
                .eq('id', pathId)
                .single()

            return data
        },
        [`path-${pathId}`],
        {
            revalidate: CACHE_DURATION.MEDIUM,
            tags: [CACHE_TAGS.PATHS, `path-${pathId}`],
        }
    )()

/**
 * Get path detail with full course data for detail page (cached)
 * Note: User progress is fetched separately since it's user-specific
 */
export const getPathDetailCached = (supabase: SupabaseClient, pathId: string) =>
    unstable_cache(
        async () => {
            const { data, error } = await supabase
                .from('learning_paths')
                .select(`
                    *,
                    organizations (name, website_url),
                    courses (
                        *,
                        organizations (name),
                        course_exercises (id)
                    )
                `)
                .eq('id', pathId)
                .order('order_index', { foreignTable: 'courses', ascending: true })
                .single()

            return { data, error }
        },
        [`path-detail-${pathId}`],
        {
            revalidate: CACHE_DURATION.MEDIUM,
            tags: [CACHE_TAGS.PATHS, `path-${pathId}`],
        }
    )()

/**
 * Get path resources (cached)
 */
export const getPathResourcesCached = (supabase: SupabaseClient, pathId: string) =>
    unstable_cache(
        async () => {
            const { data } = await supabase
                .from('path_resources')
                .select('*, profiles(username, avatar_url)')
                .eq('path_id', pathId)
                .order('created_at', { ascending: false })

            return data || []
        },
        [`path-resources-${pathId}`],
        {
            revalidate: CACHE_DURATION.SHORT,
            tags: [CACHE_TAGS.PATHS, `path-${pathId}`],
        }
    )()

/**
 * Check if user has saved a path (cached per user)
 */
export const isPathSavedCached = (supabase: SupabaseClient, userId: string, pathId: string) =>
    unstable_cache(
        async () => {
            const { data } = await supabase
                .from('saved_paths')
                .select('id')
                .eq('user_id', userId)
                .eq('path_id', pathId)
                .single()

            return !!data
        },
        [`path-saved-${userId}-${pathId}`],
        {
            revalidate: CACHE_DURATION.SHORT,
            tags: [CACHE_TAGS.USER_SAVED, `user-${userId}`, `path-${pathId}`],
        }
    )()

/**
 * Get user's progress for multiple courses (cached per user)
 */
export const getUserCoursesProgressCached = (supabase: SupabaseClient, userId: string, courseIds: string[]) =>
    unstable_cache(
        async () => {
            if (courseIds.length === 0) return []

            const { data } = await supabase
                .from('user_course_progress')
                .select('course_id, completed, xp_earned')
                .eq('user_id', userId)
                .in('course_id', courseIds)

            return data || []
        },
        [`user-courses-progress-${userId}-${courseIds.sort().join('-')}`],
        {
            revalidate: CACHE_DURATION.SHORT,
            tags: [CACHE_TAGS.USER_PROGRESS, `user-${userId}`],
        }
    )()

/**
 * Get paths by an array of IDs (cached)
 */
export const getPathsByIdsCached = (supabase: SupabaseClient, pathIds: string[]) =>
    unstable_cache(
        async () => {
            if (pathIds.length === 0) return []

            const { data } = await supabase
                .from('learning_paths')
                .select(`
                    id,
                    title,
                    summary,
                    description,
                    created_at,
                    is_validated,
                    created_by,
                    organizations (id, name),
                    courses (id),
                    saved_paths!saved_paths_path_id_fkey (user_id)
                `)
                .in('id', pathIds)
                .order('created_at', { ascending: false })

            return (data as PathListItem[]) || []
        },
        [`paths-by-ids-${pathIds.sort().join('-')}`],
        {
            revalidate: CACHE_DURATION.SHORT,
            tags: [CACHE_TAGS.PATHS],
        }
    )()

/**
 * Get IDs of paths created by user (cached per user)
 */
export const getUserCreatedPathIdsCached = (supabase: SupabaseClient, userId: string) =>
    unstable_cache(
        async () => {
            const { data } = await supabase
                .from('learning_paths')
                .select('id')
                .eq('created_by', userId)

            return data?.map(p => p.id) || []
        },
        [`user-created-paths-${userId}`],
        {
            revalidate: CACHE_DURATION.SHORT,
            tags: [CACHE_TAGS.PATHS, `user-${userId}`],
        }
    )()

/**
 * Get path IDs from user's course progress (cached per user)
 */
export const getPathIdsFromCourseProgressCached = (supabase: SupabaseClient, userId: string, courseIds: string[]) =>
    unstable_cache(
        async () => {
            if (courseIds.length === 0) return []

            const { data } = await supabase
                .from('courses')
                .select('path_id')
                .in('id', courseIds)

            return [...new Set(data?.map(c => c.path_id).filter(Boolean) || [])]
        },
        [`path-ids-from-courses-${userId}-${courseIds.sort().join('-')}`],
        {
            revalidate: CACHE_DURATION.SHORT,
            tags: [CACHE_TAGS.PATHS, CACHE_TAGS.USER_PROGRESS, `user-${userId}`],
        }
    )()

// ============================================================================
// Cached Organization Queries
// ============================================================================

/**
 * Get validated organizations (cached)
 */
export const getOrganizationsCached = (supabase: SupabaseClient, limit?: number) =>
    unstable_cache(
        async () => {
            const query = supabase
                .from('organizations')
                .select(`
                    id,
                    name,
                    description,
                    website_url,
                    is_validated,
                    learning_paths (id),
                    courses (id)
                `)
                .eq('is_validated', true)
                .order('name')

            if (limit) {
                query.limit(limit)
            }

            const { data } = await query
            return (data as unknown as OrganizationListItem[]) || []
        },
        [`organizations-${limit || 'all'}`],
        {
            revalidate: CACHE_DURATION.LONG,
            tags: [CACHE_TAGS.ORGANIZATIONS],
        }
    )()

// ============================================================================
// Cached User-Specific Queries (shorter cache, user-scoped)
// ============================================================================

/**
 * Get user's drafts (cached per user)
 */
export const getUserDraftsCached = (supabase: SupabaseClient, userId: string, limit?: number) =>
    unstable_cache(
        async () => {
            const query = supabase
                .from('courses')
                .select(`
                    id,
                    title,
                    summary,
                    thumbnail_url,
                    xp_reward,
                    status,
                    created_at
                `)
                .eq('created_by', userId)
                .or('status.eq.draft,status.eq.pending')
                .order('created_at', { ascending: false })

            if (limit) {
                query.limit(limit)
            }

            const { data } = await query
            return (data as DraftItem[]) || []
        },
        [`user-drafts-${userId}-${limit || 'all'}`],
        {
            revalidate: CACHE_DURATION.SHORT,
            tags: [CACHE_TAGS.QUESTS, `user-${userId}`],
        }
    )()

/**
 * Get user's saved quest IDs (cached per user)
 */
export const getUserSavedQuestsCached = (supabase: SupabaseClient, userId: string) =>
    unstable_cache(
        async () => {
            const { data } = await supabase
                .from('saved_courses')
                .select('course_id')
                .eq('user_id', userId)

            return data?.map(c => c.course_id) || []
        },
        [`user-saved-quests-${userId}`],
        {
            revalidate: CACHE_DURATION.SHORT,
            tags: [CACHE_TAGS.USER_SAVED, `user-${userId}`],
        }
    )()

/**
 * Get user's saved path IDs (cached per user)
 */
export const getUserSavedPathsCached = (supabase: SupabaseClient, userId: string) =>
    unstable_cache(
        async () => {
            const { data } = await supabase
                .from('saved_paths')
                .select('path_id')
                .eq('user_id', userId)

            return data?.map(p => p.path_id) || []
        },
        [`user-saved-paths-${userId}`],
        {
            revalidate: CACHE_DURATION.SHORT,
            tags: [CACHE_TAGS.USER_SAVED, `user-${userId}`],
        }
    )()

/**
 * Get user's quest progress IDs (cached per user)
 */
export const getUserProgressCached = (supabase: SupabaseClient, userId: string) =>
    unstable_cache(
        async () => {
            const { data } = await supabase
                .from('user_course_progress')
                .select('course_id, completed, xp_earned')
                .eq('user_id', userId)

            return data || []
        },
        [`user-progress-${userId}`],
        {
            revalidate: CACHE_DURATION.SHORT,
            tags: [CACHE_TAGS.USER_PROGRESS, `user-${userId}`],
        }
    )()

/**
 * Get user's exercise stats (cached per user)
 */
export const getUserExerciseStatsCached = (supabase: SupabaseClient, userId: string) =>
    unstable_cache(
        async () => {
            const { data: enrolledQuests } = await supabase
                .from('user_course_progress')
                .select('course_id')
                .eq('user_id', userId)

            if (!enrolledQuests || enrolledQuests.length === 0) {
                return { total: 0, completed: 0, pending: 0 }
            }

            const { count: totalExercises } = await supabase
                .from('course_exercises')
                .select('id', { count: 'exact' })
                .in('course_id', enrolledQuests.map(c => c.course_id))

            const { data: submissions } = await supabase
                .from('exercise_submissions')
                .select('status')
                .eq('user_id', userId)

            const completed = submissions?.filter(s => s.status === 'approved').length || 0
            const pending = submissions?.filter(s => s.status === 'pending').length || 0

            return { total: totalExercises || 0, completed, pending }
        },
        [`user-exercise-stats-${userId}`],
        {
            revalidate: CACHE_DURATION.SHORT,
            tags: [CACHE_TAGS.EXERCISES, CACHE_TAGS.USER_PROGRESS, `user-${userId}`],
        }
    )()

/**
 * Get user's most recent course activity (cached per user)
 */
export const getUserRecentActivityCached = (supabase: SupabaseClient, userId: string) =>
    unstable_cache(
        async () => {
            const { data } = await supabase
                .from('user_course_progress')
                .select(`
                    course_id,
                    completed,
                    xp_earned,
                    courses (
                        id,
                        title
                    )
                `)
                .eq('user_id', userId)
                .order('last_accessed_at', { ascending: false })
                .limit(1)
                .maybeSingle()

            return data
        },
        [`user-recent-activity-${userId}`],
        {
            revalidate: CACHE_DURATION.SHORT,
            tags: [CACHE_TAGS.USER_PROGRESS, `user-${userId}`],
        }
    )()

/**
 * Get user's saved paths with course details for dashboard (cached per user)
 */
export const getUserSavedPathsWithCoursesCached = (supabase: SupabaseClient, userId: string, limit?: number) =>
    unstable_cache(
        async () => {
            const query = supabase
                .from('saved_paths')
                .select(`
                    path:learning_paths (
                        id,
                        title,
                        summary,
                        courses (id, title, order_index)
                    )
                `)
                .eq('user_id', userId)

            if (limit) {
                query.limit(limit)
            }

            const { data } = await query
            return data || []
        },
        [`user-saved-paths-with-courses-${userId}-${limit || 'all'}`],
        {
            revalidate: CACHE_DURATION.SHORT,
            tags: [CACHE_TAGS.USER_SAVED, CACHE_TAGS.PATHS, `user-${userId}`],
        }
    )()

/**
 * Get published courses with optional user progress (cached)
 * Note: User progress filtering happens on client side
 */
export const getPublishedCoursesWithOrgsCached = (supabase: SupabaseClient, limit?: number) =>
    unstable_cache(
        async () => {
            const query = supabase
                .from('courses')
                .select(`
                    id,
                    title,
                    thumbnail_url,
                    xp_reward,
                    status,
                    is_validated,
                    organizations (name)
                `)
                .eq('status', 'published')
                .eq('is_validated', true)

            if (limit) {
                query.limit(limit)
            }

            const { data } = await query
            return data || []
        },
        [`published-courses-with-orgs-${limit || 'all'}`],
        {
            revalidate: CACHE_DURATION.MEDIUM,
            tags: [CACHE_TAGS.QUESTS],
        }
    )()

/**
 * Get saved courses by IDs with details (cached per user)
 */
export const getSavedCoursesByIdsCached = (supabase: SupabaseClient, courseIds: string[], limit?: number) =>
    unstable_cache(
        async () => {
            if (courseIds.length === 0) return []

            const query = supabase
                .from('courses')
                .select(`
                    id,
                    title,
                    thumbnail_url,
                    xp_reward,
                    status,
                    organizations (name)
                `)
                .in('id', courseIds)

            if (limit) {
                query.limit(limit)
            }

            const { data } = await query
            return data || []
        },
        [`saved-courses-${courseIds.sort().join('-')}-${limit || 'all'}`],
        {
            revalidate: CACHE_DURATION.SHORT,
            tags: [CACHE_TAGS.QUESTS, CACHE_TAGS.USER_SAVED],
        }
    )()

// ============================================================================
// Cached Admin Queries
// ============================================================================

/**
 * Get pending validations count (cached)
 */
export const getPendingValidationsCached = (supabase: SupabaseClient) =>
    unstable_cache(
        async () => {
            const [questsRes, orgsRes, pathsRes, editsRes] = await Promise.all([
                supabase
                    .from('courses')
                    .select('id', { count: 'exact' })
                    .eq('is_validated', false)
                    .eq('status', 'published'),
                supabase
                    .from('organizations')
                    .select('id', { count: 'exact' })
                    .eq('is_validated', false),
                supabase
                    .from('learning_paths')
                    .select('id', { count: 'exact' })
                    .eq('is_validated', false),
                supabase
                    .from('edit_requests')
                    .select('id', { count: 'exact' })
                    .eq('status', 'pending'),
            ])

            return {
                quests: questsRes.count || 0,
                organizations: orgsRes.count || 0,
                paths: pathsRes.count || 0,
                edits: editsRes.count || 0,
                total: (questsRes.count || 0) + (orgsRes.count || 0) + (pathsRes.count || 0) + (editsRes.count || 0),
            }
        },
        ['pending-validations'],
        {
            revalidate: CACHE_DURATION.SHORT,
            tags: [CACHE_TAGS.ADMIN, CACHE_TAGS.QUESTS, CACHE_TAGS.PATHS, CACHE_TAGS.ORGANIZATIONS],
        }
    )()

/**
 * Get pending submissions count (cached)
 */
export const getPendingSubmissionsCached = (supabase: SupabaseClient) =>
    unstable_cache(
        async () => {
            const { count } = await supabase
                .from('exercise_submissions')
                .select('id', { count: 'exact' })
                .eq('status', 'pending')

            return count || 0
        },
        ['pending-submissions'],
        {
            revalidate: CACHE_DURATION.SHORT,
            tags: [CACHE_TAGS.ADMIN, CACHE_TAGS.SUBMISSIONS],
        }
    )()

/**
 * Get pending admin requests count (cached)
 */
export const getPendingAdminRequestsCountCached = (supabase: SupabaseClient) =>
    unstable_cache(
        async () => {
            const { count } = await supabase
                .from('admin_requests')
                .select('id', { count: 'exact' })
                .eq('status', 'pending')

            return count || 0
        },
        ['pending-admin-requests-count'],
        {
            revalidate: CACHE_DURATION.SHORT,
            tags: [CACHE_TAGS.ADMIN],
        }
    )()

/**
 * Get recent pending quests for admin preview (cached)
 */
export const getRecentPendingQuestsCached = (supabase: SupabaseClient, limit: number = 3) =>
    unstable_cache(
        async () => {
            const { data } = await supabase
                .from('courses')
                .select('id, title, created_at')
                .eq('is_validated', false)
                .eq('status', 'published')
                .order('created_at', { ascending: false })
                .limit(limit)

            return data || []
        },
        [`recent-pending-quests-${limit}`],
        {
            revalidate: CACHE_DURATION.SHORT,
            tags: [CACHE_TAGS.ADMIN, CACHE_TAGS.QUESTS],
        }
    )()

/**
 * Get recent pending submissions for admin preview (cached)
 */
export const getRecentPendingSubmissionsCached = (supabase: SupabaseClient, limit: number = 3) =>
    unstable_cache(
        async () => {
            const { data } = await supabase
                .from('exercise_submissions')
                .select(`
                    id,
                    submitted_at,
                    course_exercises (title)
                `)
                .eq('status', 'pending')
                .order('submitted_at', { ascending: false })
                .limit(limit)

            return data || []
        },
        [`recent-pending-submissions-${limit}`],
        {
            revalidate: CACHE_DURATION.SHORT,
            tags: [CACHE_TAGS.ADMIN, CACHE_TAGS.SUBMISSIONS],
        }
    )()

/**
 * Get recent admin requests for admin preview (cached)
 */
export const getRecentAdminRequestsCached = (supabase: SupabaseClient, limit: number = 3) =>
    unstable_cache(
        async () => {
            const { data } = await supabase
                .from('admin_requests')
                .select(`
                    id,
                    created_at,
                    profiles:user_id (username)
                `)
                .eq('status', 'pending')
                .order('created_at', { ascending: false })
                .limit(limit)

            return data || []
        },
        [`recent-admin-requests-${limit}`],
        {
            revalidate: CACHE_DURATION.SHORT,
            tags: [CACHE_TAGS.ADMIN],
        }
    )()

// ============================================================================
// Admin Full List Cached Queries
// ============================================================================

/**
 * Get pending quests for validation list (cached)
 */
export const getPendingQuestsListCached = (supabase: SupabaseClient) =>
    unstable_cache(
        async () => {
            const { data } = await supabase
                .from('courses')
                .select(`
                    id,
                    title,
                    summary,
                    is_validated,
                    created_at,
                    organizations (id, name),
                    draft_data
                `)
                .eq('is_validated', false)
                .eq('status', 'published')
                .order('created_at', { ascending: false })

            return data || []
        },
        ['pending-quests-list'],
        {
            revalidate: CACHE_DURATION.SHORT,
            tags: [CACHE_TAGS.ADMIN, CACHE_TAGS.QUESTS],
        }
    )()

/**
 * Get quests with pending draft edits (cached)
 */
export const getQuestsWithDraftEditsCached = (supabase: SupabaseClient) =>
    unstable_cache(
        async () => {
            const { data } = await supabase
                .from('courses')
                .select(`
                    id,
                    title,
                    summary,
                    is_validated,
                    created_at,
                    organizations (id, name),
                    draft_data
                `)
                .not('draft_data', 'is', null)
                .eq('is_validated', true)
                .order('created_at', { ascending: false })

            return data || []
        },
        ['quests-with-draft-edits'],
        {
            revalidate: CACHE_DURATION.SHORT,
            tags: [CACHE_TAGS.ADMIN, CACHE_TAGS.QUESTS],
        }
    )()

/**
 * Get pending organizations for validation (cached)
 */
export const getPendingOrgsListCached = (supabase: SupabaseClient) =>
    unstable_cache(
        async () => {
            const { data } = await supabase
                .from('organizations')
                .select('id, name, description, website_url, is_validated, created_at')
                .eq('is_validated', false)
                .order('created_at', { ascending: false })

            return data || []
        },
        ['pending-orgs-list'],
        {
            revalidate: CACHE_DURATION.SHORT,
            tags: [CACHE_TAGS.ADMIN, CACHE_TAGS.ORGANIZATIONS],
        }
    )()

/**
 * Get pending paths for validation (cached)
 */
export const getPendingPathsListCached = (supabase: SupabaseClient) =>
    unstable_cache(
        async () => {
            const { data } = await supabase
                .from('learning_paths')
                .select(`
                    id,
                    title,
                    summary,
                    is_validated,
                    created_at,
                    organizations (id, name)
                `)
                .eq('is_validated', false)
                .order('created_at', { ascending: false })

            return data || []
        },
        ['pending-paths-list'],
        {
            revalidate: CACHE_DURATION.SHORT,
            tags: [CACHE_TAGS.ADMIN, CACHE_TAGS.PATHS],
        }
    )()

/**
 * Get pending edit requests (cached)
 */
export const getPendingEditRequestsCached = (supabase: SupabaseClient) =>
    unstable_cache(
        async () => {
            const { data } = await supabase
                .from('edit_requests')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false })

            return data || []
        },
        ['pending-edit-requests'],
        {
            revalidate: CACHE_DURATION.SHORT,
            tags: [CACHE_TAGS.ADMIN],
        }
    )()

/**
 * Get all submissions for admin review (cached)
 */
export const getSubmissionsListCached = (supabase: SupabaseClient) =>
    unstable_cache(
        async () => {
            const { data } = await supabase
                .from('exercise_submissions')
                .select(`
                    *,
                    profiles!exercise_submissions_user_id_fkey (username),
                    course_exercises (
                        title,
                        courses (title, id)
                    )
                `)
                .order('submitted_at', { ascending: false })

            return data || []
        },
        ['submissions-list'],
        {
            revalidate: CACHE_DURATION.SHORT,
            tags: [CACHE_TAGS.ADMIN, CACHE_TAGS.SUBMISSIONS],
        }
    )()



/**
 * Get user profile (cached per user)
 */
export const getUserProfileCached = (supabase: SupabaseClient, userId: string) =>
    unstable_cache(
        async () => {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            return data
        },
        [`user-profile-${userId}`],
        {
            revalidate: CACHE_DURATION.SHORT,
            tags: [`user-${userId}`],
        }
    )()
