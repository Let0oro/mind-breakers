/**
 * Centralized Supabase query functions for reuse across pages
 * These functions work with both server and client Supabase instances
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { ExpeditionListItem } from './types'

// ============================================================================
// Types
// ============================================================================

export interface QuestListItem {
    id: string
    title: string
    summary?: string
    thumbnail_url?: string
    xp_reward: number
    is_validated?: boolean
    created_by: string
    status: 'draft' | 'published' | 'archived'
    organizations: { name: string }[] | null
    user_quest_progress?: { completed: boolean; xp_earned: number }[]
    saved_quests?: { user_id: string }[]
}

export interface OrganizationListItem {
    id: string
    name: string
    description?: string
    website_url?: string
    is_validated: boolean
    created_by?: string
    expeditions?: { id: string }[]
    quests?: { id: string }[]
}

export interface ExerciseListItem {
    id: string
    title: string
    description?: string
    status: 'completed' | 'in_progress' | 'pending_review' | 'not_started'
    xp_reward: number
    quest_title?: string
    quest_id?: string
    submitted_at?: string
}

export interface DraftItem {
    id: string
    title: string
    summary?: string
    thumbnail_url?: string
    xp_reward: number
    status: 'draft' | 'pending'
    created_at: string
}

export interface UserLibraryData {
    drafts: DraftItem[]
    quests: QuestListItem[]
    expeditions: ExpeditionListItem[]
    organizations: OrganizationListItem[]
    savedQuestIds: Set<string>
    savedExpeditionIds: Set<string>
    exerciseStats: {
        total: number
        completed: number
        pending: number
    }
}

// ============================================================================
// User Content Queries
// ============================================================================

/**
 * Get user's saved quest IDs
 */
export async function getUserSavedQuests(
    supabase: SupabaseClient,
    userId: string
): Promise<string[]> {
    const { data } = await supabase
        .from('saved_quests')
        .select('quest_id')
        .eq('user_id', userId)

    return data?.map(c => c.quest_id) || []
}

/**
 * Get user's saved expedition IDs
 */
export async function getUserSavedExpeditions(
    supabase: SupabaseClient,
    userId: string
): Promise<string[]> {
    const { data } = await supabase
        .from('saved_expeditions')
        .select('expedition_id')
        .eq('user_id', userId)

    return data?.map(p => p.expedition_id) || []
}

/**
 * Get user's quest progress IDs
 */
export async function getUserProgressQuests(
    supabase: SupabaseClient,
    userId: string
): Promise<string[]> {
    const { data } = await supabase
        .from('user_quest_progress')
        .select('quest_id')
        .eq('user_id', userId)

    return data?.map(c => c.quest_id) || []
}

/**
 * Get user's created quest IDs
 */
export async function getUserCreatedQuests(
    supabase: SupabaseClient,
    userId: string
): Promise<string[]> {
    const { data } = await supabase
        .from('quests')
        .select('id')
        .eq('created_by', userId)

    return data?.map(c => c.id) || []
}

/**
 * Get user's created expedition IDs
 */
export async function getUserCreatedExpeditions(
    supabase: SupabaseClient,
    userId: string
): Promise<string[]> {
    const { data } = await supabase
        .from('expeditions')
        .select('id')
        .eq('created_by', userId)

    return data?.map(p => p.id) || []
}

// ============================================================================
// Quest Queries
// ============================================================================

/**
 * Get quests by IDs with full details
 */
export async function getQuestsByIds(
    supabase: SupabaseClient,
    questIds: string[],
    options?: {
        includeProgress?: boolean
        includeSaved?: boolean
        status?: 'draft' | 'published' | 'archived'
        limit?: number
    }
): Promise<QuestListItem[]> {
    if (questIds.length === 0) return []

    let query = supabase
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
            ${options?.includeProgress ? ', user_quest_progress (completed, xp_earned)' : ''}
            ${options?.includeSaved ? ', saved_quests (user_id)' : ''}
        `)
        .in('id', questIds)
        .order('created_at', { ascending: false })

    if (options?.status) {
        query = query.eq('status', options.status)
    }

    if (options?.limit) {
        query = query.limit(options.limit)
    }

    const { data } = await query
    return (data as unknown as QuestListItem[]) || []
}

/**
 * Get user's draft quests
 */
export async function getUserDrafts(
    supabase: SupabaseClient,
    userId: string,
    limit?: number
): Promise<DraftItem[]> {
    let query = supabase
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
        query = query.limit(limit)
    }

    const { data } = await query
    return (data as DraftItem[]) || []
}

/**
 * Search quests with optional filters
 */
export async function searchQuests(
    supabase: SupabaseClient,
    options?: {
        query?: string
        validated?: boolean
        status?: 'published' | 'draft' | 'archived'
        limit?: number
    }
): Promise<QuestListItem[]> {
    let dbQuery = supabase
        .from('quests')
        .select(`id, title, summary, thumbnail_url, xp_reward, organizations (name)`)
        .order('created_at', { ascending: false })

    if (options?.status) {
        dbQuery = dbQuery.eq('status', options.status)
    }

    if (options?.validated !== undefined) {
        dbQuery = dbQuery.eq('is_validated', options.validated)
    }

    if (options?.query) {
        dbQuery = dbQuery.or(`title.ilike.%${options.query}%,summary.ilike.%${options.query}%`)
    }

    if (options?.limit) {
        dbQuery = dbQuery.limit(options.limit)
    }

    const { data } = await dbQuery
    return (data as unknown as QuestListItem[]) || []
}

// ============================================================================
// Expedition Queries
// ============================================================================

/**
 * Get expeditions by IDs with full details
 */
export async function getExpeditionsByIds(
    supabase: SupabaseClient,
    expeditionIds: string[],
    limit?: number
): Promise<ExpeditionListItem[]> {
    if (expeditionIds.length === 0) return []

    let query = supabase
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
            quests (id)
        `)
        .in('id', expeditionIds)
        .order('created_at', { ascending: false })

    if (limit) {
        query = query.limit(limit)
    }

    const { data } = await query
    return data || []
}

/**
 * Search expeditions with optional filters
 */
export async function searchExpeditions(
    supabase: SupabaseClient,
    options?: {
        query?: string
        validated?: boolean
        limit?: number
    }
): Promise<ExpeditionListItem[]> {
    let dbQuery = supabase
        .from('expeditions')
        .select(`id, title, summary, description, created_at, created_by, is_validated, organizations (id, name), quests (id)`)
        .order('created_at', { ascending: false })

    if (options?.validated !== undefined) {
        dbQuery = dbQuery.eq('is_validated', options.validated)
    }

    if (options?.query) {
        dbQuery = dbQuery.or(`title.ilike.%${options.query}%,summary.ilike.%${options.query}%,description.ilike.%${options.query}%`)
    }

    if (options?.limit) {
        dbQuery = dbQuery.limit(options.limit)
    }

    const { data } = await dbQuery
    return data || []
}

// ============================================================================
// Organization Queries
// ============================================================================

/**
 * Get organizations visible to user
 */
export async function getOrganizations(
    supabase: SupabaseClient,
    userId?: string,
    limit?: number
): Promise<OrganizationListItem[]> {
    let query = supabase
        .from('organizations')
        .select(`
            id,
            name,
            description,
            website_url,
            is_validated,
            created_by,
            expeditions (id),
            quests (id)
        `)
        .order('name')

    if (userId) {
        query = query.or(`is_validated.eq.true,created_by.eq.${userId}`)
    } else {
        query = query.eq('is_validated', true)
    }

    if (limit) {
        query = query.limit(limit)
    }

    const { data } = await query
    return (data as unknown as OrganizationListItem[]) || []
}

/**
 * Search organizations with optional query
 */
export async function searchOrganizations(
    supabase: SupabaseClient,
    options?: {
        query?: string
        limit?: number
    }
): Promise<OrganizationListItem[]> {
    let dbQuery = supabase
        .from('organizations')
        .select(`id, name, description, expeditions (id), quests (id)`)
        .order('name')

    if (options?.query) {
        dbQuery = dbQuery.or(`name.ilike.%${options.query}%,description.ilike.%${options.query}%`)
    }

    if (options?.limit) {
        dbQuery = dbQuery.limit(options.limit)
    }

    const { data } = await dbQuery
    return (data as unknown as OrganizationListItem[]) || []
}

// ============================================================================
// Exercise Queries
// ============================================================================

/**
 * Get user's exercise stats
 */
export async function getUserExerciseStats(
    supabase: SupabaseClient,
    userId: string
): Promise<{ total: number; completed: number; pending: number }> {
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
}

// ============================================================================
// Combined Queries (for Dashboard pages)
// ============================================================================

/**
 * Get all user library data in a single call
 * Optimized for the Library dashboard page
 */
export async function getUserLibraryData(
    supabase: SupabaseClient,
    userId: string,
    limits?: {
        drafts?: number
        quests?: number
        expeditions?: number
        organizations?: number
    }
): Promise<UserLibraryData> {
    // Parallel fetch of all user-related IDs
    const [
        savedQuestIds,
        savedExpeditionIds,
        progressQuestIds,
        createdQuestIds,
        createdExpeditionIds,
        drafts,
        organizations,
        exerciseStats
    ] = await Promise.all([
        getUserSavedQuests(supabase, userId),
        getUserSavedExpeditions(supabase, userId),
        getUserProgressQuests(supabase, userId),
        getUserCreatedQuests(supabase, userId),
        getUserCreatedExpeditions(supabase, userId),
        getUserDrafts(supabase, userId, limits?.drafts),
        getOrganizations(supabase, userId, limits?.organizations),
        getUserExerciseStats(supabase, userId)
    ])

    // Combine IDs for quests and expeditions
    const allQuestIds = new Set([
        ...savedQuestIds,
        ...progressQuestIds,
        ...createdQuestIds.filter(id => {
            // Filter out drafts since they're already fetched
            return !drafts.some(d => d.id === id)
        })
    ])

    const allExpeditionIds = new Set([
        ...savedExpeditionIds,
        ...createdExpeditionIds
    ])

    // Fetch quests and expeditions
    const [quests, expeditions] = await Promise.all([
        getQuestsByIds(supabase, Array.from(allQuestIds), {
            status: 'published',
            limit: limits?.quests,
            includeProgress: true
        }),
        getExpeditionsByIds(supabase, Array.from(allExpeditionIds), limits?.expeditions)
    ])

    return {
        drafts,
        quests,
        expeditions,
        organizations,
        savedQuestIds: new Set(savedQuestIds),
        savedExpeditionIds: new Set(savedExpeditionIds),
        exerciseStats
    }
}

