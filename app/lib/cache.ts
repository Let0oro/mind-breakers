/**
 * Server-side cached queries using Next.js unstable_cache
 * These functions cache database results and can be invalidated with tags
 */

import { unstable_cache } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ExpeditionListItem } from './types'
import type { QuestListItem, OrganizationListItem, DraftItem } from './queries'

// Re-export types with Quest naming
export type { QuestListItem as QuestListItem }

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
    QUESTS: 'quests',
    EXPEDITIONS: 'expeditions',
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
                .from('quests')
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
            return (data as unknown as QuestListItem[]) || []
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
                .from('quests')
                .select(`
                    *,
                    organizations (id, name),
                    quest_exercises (id, title, description)
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
                .from('quests')
                .select(`
                    *,
                    expeditions (id, title),
                    organizations (name, website_url),
                    quest_exercises (*)
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
 * Get user's quest progress for a specific quest (cached per user)
 */
export const getUserQuestProgressCached = (supabase: SupabaseClient, userId: string, questId: string) =>
    unstable_cache(
        async () => {
            const { data } = await supabase
                .from('user_quest_progress')
                .select('id, completed, completed_at, xp_earned')
                .eq('user_id', userId)
                .eq('quest_id', questId)
                .single()

            return data
        },
        [`user-quest-progress-${userId}-${questId}`],
        {
            revalidate: CACHE_DURATION.SHORT,
            tags: [CACHE_TAGS.USER_PROGRESS, `user-${userId}`, `quest-${questId}`],
        }
    )()

/**
 * Get user's exercise submissions for a quest (cached per user)
 */
export const getUserExerciseSubmissionsCached = (supabase: SupabaseClient, userId: string, exerciseIds: string[]) =>
    unstable_cache(
        async () => {
            if (exerciseIds.length === 0) return []

            const { data } = await supabase
                .from('exercise_submissions')
                .select('*, quest_exercises (*)')
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
 * Check if user has saved a quest (cached per user)
 */
export const isQuestSavedCached = (supabase: SupabaseClient, userId: string, questId: string) =>
    unstable_cache(
        async () => {
            const { data } = await supabase
                .from('saved_quests')
                .select('id')
                .eq('user_id', userId)
                .eq('quest_id', questId)
                .single()

            return !!data
        },
        [`quest-saved-${userId}-${questId}`],
        {
            revalidate: CACHE_DURATION.SHORT,
            tags: [CACHE_TAGS.USER_SAVED, `user-${userId}`, `quest-${questId}`],
        }
    )()

/**
 * Get IDs of quests created by user (cached per user)
 */
export const getUserCreatedQuestIdsCached = (supabase: SupabaseClient, userId: string) =>
    unstable_cache(
        async () => {
            const { data } = await supabase
                .from('quests')
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
export const getQuestsByIdsCached = (supabase: SupabaseClient, userId: string, questIds: string[]) =>
    unstable_cache(
        async () => {
            if (questIds.length === 0) return []

            const { data } = await supabase
                .from('quests')
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
                    user_quest_progress (
                        completed,
                        xp_earned
                    ),
                    saved_quests (
                        user_id
                    )
                `)
                .in('id', questIds)
                .order('created_at', { ascending: false })

            return data || []
        },
        [`quests-by-ids-${userId}-${questIds.sort().join('-')}`],
        {
            revalidate: CACHE_DURATION.SHORT,
            tags: [CACHE_TAGS.QUESTS, `user-${userId}`],
        }
    )()

// ============================================================================
// Cached Expedition Queries
// ============================================================================

/**
 * Get validated expeditions (cached)
 */
export const getValidatedExpeditionsCached = (supabase: SupabaseClient, limit?: number) =>
    unstable_cache(
        async () => {
            const query = supabase
                .from('expeditions')
                .select(`
                    id,
                    title,
                    summary,
                    description,
                    created_at,
                    created_by,
                    is_validated,
                    organizations (id, name),
                    quests (id)
                `)
                .eq('is_validated', true)
                .order('created_at', { ascending: false })

            if (limit) {
                query.limit(limit)
            }

            const { data } = await query
            return (data as ExpeditionListItem[]) || []
        },
        [`validated-expeditions-${limit || 'all'}`],
        {
            revalidate: CACHE_DURATION.MEDIUM,
            tags: [CACHE_TAGS.EXPEDITIONS],
        }
    )()

/**
 * Get a single expedition by ID (cached)
 */
export const getExpeditionCached = (supabase: SupabaseClient, expeditionId: string) =>
    unstable_cache(
        async () => {
            const { data } = await supabase
                .from('expeditions')
                .select(`
                    *,
                    organizations (id, name),
                    quests (
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
                .eq('id', expeditionId)
                .single()

            return data
        },
        [`expedition-${expeditionId}`],
        {
            revalidate: CACHE_DURATION.MEDIUM,
            tags: [CACHE_TAGS.EXPEDITIONS, `expedition-${expeditionId}`],
        }
    )()

/**
 * Get expedition detail with full quest data for detail page (cached)
 * Note: User progress is fetched separately since it's user-specific
 */
export const getExpeditionDetailCached = (supabase: SupabaseClient, expeditionId: string) =>
    unstable_cache(
        async () => {
            const { data, error } = await supabase
                .from('expeditions')
                .select(`
                    *,
                    organizations (name, website_url),
                    quests (
                        *,
                        organizations (name),
                        quest_exercises (id)
                    )
                `)
                .eq('id', expeditionId)
                .order('order_index', { foreignTable: 'quests', ascending: true })
                .single()

            return { data, error }
        },
        [`expedition-detail-${expeditionId}`],
        {
            revalidate: CACHE_DURATION.MEDIUM,
            tags: [CACHE_TAGS.EXPEDITIONS, `expedition-${expeditionId}`],
        }
    )()

/**
 * Get expedition resources (cached)
 */
export const getExpeditionResourcesCached = (supabase: SupabaseClient, expeditionId: string) =>
    unstable_cache(
        async () => {
            const { data } = await supabase
                .from('expedition_resources')
                .select('*, profiles(username, avatar_url)')
                .eq('expedition_id', expeditionId)
                .order('created_at', { ascending: false })

            return data || []
        },
        [`expedition-resources-${expeditionId}`],
        {
            revalidate: CACHE_DURATION.SHORT,
            tags: [CACHE_TAGS.EXPEDITIONS, `expedition-${expeditionId}`],
        }
    )()

/**
 * Check if user has saved a expedition (cached per user)
 */
export const isExpeditionSavedCached = (supabase: SupabaseClient, userId: string, expeditionId: string) =>
    unstable_cache(
        async () => {
            const { data } = await supabase
                .from('saved_expeditions')
                .select('id')
                .eq('user_id', userId)
                .eq('expedition_id', expeditionId)
                .single()

            return !!data
        },
        [`expedition-saved-${userId}-${expeditionId}`],
        {
            revalidate: CACHE_DURATION.SHORT,
            tags: [CACHE_TAGS.USER_SAVED, `user-${userId}`, `expedition-${expeditionId}`],
        }
    )()

/**
 * Get user's progress for multiple quests (cached per user)
 */
export const getUserQuestsProgressCached = (supabase: SupabaseClient, userId: string, questIds: string[]) =>
    unstable_cache(
        async () => {
            if (questIds.length === 0) return []

            const { data } = await supabase
                .from('user_quest_progress')
                .select('quest_id, completed, xp_earned')
                .eq('user_id', userId)
                .in('quest_id', questIds)

            return data || []
        },
        [`user-quests-progress-${userId}-${questIds.sort().join('-')}`],
        {
            revalidate: CACHE_DURATION.SHORT,
            tags: [CACHE_TAGS.USER_PROGRESS, `user-${userId}`],
        }
    )()

/**
 * Get expeditions by an array of IDs (cached)
 */
export const getExpeditionsByIdsCached = (supabase: SupabaseClient, userId: string, expeditionIds: string[]) =>
    unstable_cache(
        async () => {
            if (expeditionIds.length === 0) return []

            const { data, error } = await supabase
                .from('expeditions')
                .select(`
                    id,
                    title,
                    summary,
                    description,
                    created_at,
                    is_validated,
                    created_by,
                    organizations (id, name),
                    quests (id),
                    saved_expeditions!saved_expeditions_expedition_id_fkey (user_id)
                `)
                .in('id', expeditionIds)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error in getExpeditionsByIdsCached:', error)
                return []
            }

            return (data as ExpeditionListItem[]) || []
        },
        [`expeditions-by-ids-${userId}-${expeditionIds.sort().join('-')}`],
        {
            revalidate: CACHE_DURATION.SHORT,
            tags: [CACHE_TAGS.EXPEDITIONS, `user-${userId}`],
        }
    )()

/**
 * Get IDs of expeditions created by user (cached per user)
 */
export const getUserCreatedExpeditionIdsCached = (supabase: SupabaseClient, userId: string) =>
    unstable_cache(
        async () => {
            const { data } = await supabase
                .from('expeditions')
                .select('id')
                .eq('created_by', userId)

            return data?.map(p => p.id) || []
        },
        [`user-created-expeditions-${userId}`],
        {
            revalidate: CACHE_DURATION.SHORT,
            tags: [CACHE_TAGS.EXPEDITIONS, `user-${userId}`],
        }
    )()

/**
 * Get expedition IDs from user's quest progress (cached per user)
 */
export const getExpeditionIdsFromQuestProgressCached = (supabase: SupabaseClient, userId: string, questIds: string[]) =>
    unstable_cache(
        async () => {
            if (questIds.length === 0) return []

            const { data, error } = await supabase
                .from('quests')
                .select('expedition_id')
                .in('id', questIds)

            if (error) {
                console.error('Error in getExpeditionIdsFromQuestProgressCached:', error)
                return []
            }

            return [...new Set(data?.map(c => c.expedition_id).filter(Boolean) || [])]
        },
        [`expedition-ids-from-quests-${userId}-${questIds.sort().join('-')}`],
        {
            revalidate: CACHE_DURATION.SHORT,
            tags: [CACHE_TAGS.EXPEDITIONS, CACHE_TAGS.USER_PROGRESS, `user-${userId}`],
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
                    expeditions (id),
                    quests (id)
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
                .from('quests')
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
                .from('saved_quests')
                .select('quest_id')
                .eq('user_id', userId)

            return data?.map(c => c.quest_id) || []
        },
        [`user-saved-quests-${userId}`],
        {
            revalidate: CACHE_DURATION.SHORT,
            tags: [CACHE_TAGS.USER_SAVED, `user-${userId}`],
        }
    )()

/**
 * Get user's saved expedition IDs (cached per user)
 */
export const getUserSavedExpeditionsCached = (supabase: SupabaseClient, userId: string) =>
    unstable_cache(
        async () => {
            const { data } = await supabase
                .from('saved_expeditions')
                .select('expedition_id')
                .eq('user_id', userId)

            return data?.map(p => p.expedition_id) || []
        },
        [`user-saved-expeditions-${userId}`],
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
                .from('user_quest_progress')
                .select('quest_id, completed, xp_earned')
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
                .from('user_quest_progress')
                .select('quest_id')
                .eq('user_id', userId)

            if (!enrolledQuests || enrolledQuests.length === 0) {
                return { total: 0, completed: 0, pending: 0 }
            }

            const { count: totalExercises } = await supabase
                .from('quest_exercises')
                .select('id', { count: 'exact' })
                .in('quest_id', enrolledQuests.map(c => c.quest_id))

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
 * Get user's most recent quest activity (cached per user)
 */
export const getUserRecentActivityCached = (supabase: SupabaseClient, userId: string) =>
    unstable_cache(
        async () => {
            const { data } = await supabase
                .from('user_quest_progress')
                .select(`
                    quest_id,
                    completed,
                    xp_earned,
                    quests (
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
 * Get user's saved expeditions with quest details for dashboard (cached per user)
 */
export const getUserSavedExpeditionsWithQuestsCached = (supabase: SupabaseClient, userId: string, limit?: number) =>
    unstable_cache(
        async () => {
            const query = supabase
                .from('saved_expeditions')
                .select(`
                    expedition:expeditions (
                        id,
                        title,
                        summary,
                        quests (id, title, order_index)
                    )
                `)
                .eq('user_id', userId)

            if (limit) {
                query.limit(limit)
            }

            const { data } = await query
            return data || []
        },
        [`user-saved-expeditions-with-quests-${userId}-${limit || 'all'}`],
        {
            revalidate: CACHE_DURATION.SHORT,
            tags: [CACHE_TAGS.USER_SAVED, CACHE_TAGS.EXPEDITIONS, `user-${userId}`],
        }
    )()

/**
 * Get published quests with optional user progress (cached)
 * Note: User progress filtering happens on client side
 */
export const getPublishedQuestsWithOrgsCached = (supabase: SupabaseClient, limit?: number) =>
    unstable_cache(
        async () => {
            const query = supabase
                .from('quests')
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
        [`published-quests-with-orgs-${limit || 'all'}`],
        {
            revalidate: CACHE_DURATION.MEDIUM,
            tags: [CACHE_TAGS.QUESTS],
        }
    )()

/**
 * Get saved quests by IDs with details (cached per user)
 */
export const getSavedQuestsByIdsCached = (supabase: SupabaseClient, questIds: string[], limit?: number) =>
    unstable_cache(
        async () => {
            if (questIds.length === 0) return []

            const query = supabase
                .from('quests')
                .select(`
                    id,
                    title,
                    thumbnail_url,
                    xp_reward,
                    status,
                    organizations (name)
                `)
                .in('id', questIds)

            if (limit) {
                query.limit(limit)
            }

            const { data } = await query
            return data || []
        },
        [`saved-quests-${questIds.sort().join('-')}-${limit || 'all'}`],
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
            const [questsRes, orgsRes, expeditionsRes, editsRes] = await Promise.all([
                supabase
                    .from('quests')
                    .select('id', { count: 'exact' })
                    .eq('is_validated', false)
                    .eq('status', 'published'),
                supabase
                    .from('organizations')
                    .select('id', { count: 'exact' })
                    .eq('is_validated', false),
                supabase
                    .from('expeditions')
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
                expeditions: expeditionsRes.count || 0,
                edits: editsRes.count || 0,
                total: (questsRes.count || 0) + (orgsRes.count || 0) + (expeditionsRes.count || 0) + (editsRes.count || 0),
            }
        },
        ['pending-validations'],
        {
            revalidate: CACHE_DURATION.SHORT,
            tags: [CACHE_TAGS.ADMIN, CACHE_TAGS.QUESTS, CACHE_TAGS.EXPEDITIONS, CACHE_TAGS.ORGANIZATIONS],
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
                .from('quests')
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
                    quest_exercises (title)
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
                .from('quests')
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
                .from('quests')
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
 * Get pending expeditions for validation (cached)
 */
export const getPendingExpeditionsListCached = (supabase: SupabaseClient) =>
    unstable_cache(
        async () => {
            const { data } = await supabase
                .from('expeditions')
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
        ['pending-expeditions-list'],
        {
            revalidate: CACHE_DURATION.SHORT,
            tags: [CACHE_TAGS.ADMIN, CACHE_TAGS.EXPEDITIONS],
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
                    quest_exercises (
                        title,
                        quests (title, id)
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
