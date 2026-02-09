'use client'

/**
 * SWR hooks for client-side data fetching with caching
 * Use these in Client Components for automatic caching, refetching, and deduplication
 */

import useSWR, { mutate as globalMutate } from 'swr'
import { createClient } from '@/utils/supabase/client'
import type { PathListItem } from './types'
import type { CourseListItem, OrganizationListItem } from './queries'

// Re-export types with Quest naming
export type { CourseListItem as QuestListItem }

// ============================================================================
// SWR Configuration
// ============================================================================

const SWR_CONFIG = {
    revalidateOnFocus: true,      // Refetch when window regains focus
    revalidateOnReconnect: true,  // Refetch when network reconnects
    dedupingInterval: 2000,       // Dedupe requests within 2 seconds
    errorRetryCount: 3,           // Retry failed requests 3 times
}

// ============================================================================
// Cache Keys - use these for invalidation
// ============================================================================

export const SWR_KEYS = {
    QUESTS: '/api/quests',
    PATHS: '/api/paths',
    ORGANIZATIONS: '/api/organizations',
    USER_SAVED_QUESTS: (userId: string) => `/api/user/${userId}/saved-quests`,
    USER_SAVED_PATHS: (userId: string) => `/api/user/${userId}/saved-paths`,
    SEARCH: (query: string, tab: string) => `/api/search?q=${query}&tab=${tab}`,
} as const

// ============================================================================
// Fetcher Functions
// ============================================================================

const supabase = createClient()

async function fetchQuests(options?: {
    query?: string
    validated?: boolean
    status?: 'published' | 'draft' | 'archived'
    limit?: number
}): Promise<CourseListItem[]> {
    let dbQuery = supabase
        .from('courses')
        .select(`id, title, summary, thumbnail_url, xp_reward, status, organizations (name)`)
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

    const { data, error } = await dbQuery
    if (error) throw error
    return (data as unknown as CourseListItem[]) || []
}

async function fetchPaths(options?: {
    query?: string
    validated?: boolean
    limit?: number
}): Promise<PathListItem[]> {
    let dbQuery = supabase
        .from('learning_paths')
        .select(`id, title, summary, description, created_at, created_by, is_validated, organizations (id, name), courses (id)`)
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

    const { data, error } = await dbQuery
    if (error) throw error
    return data || []
}

async function fetchOrganizations(options?: {
    query?: string
    limit?: number
}): Promise<OrganizationListItem[]> {
    let dbQuery = supabase
        .from('organizations')
        .select(`id, name, description, is_validated, learning_paths (id), courses (id)`)
        .eq('is_validated', true)
        .order('name')

    if (options?.query) {
        dbQuery = dbQuery.or(`name.ilike.%${options.query}%,description.ilike.%${options.query}%`)
    }

    if (options?.limit) {
        dbQuery = dbQuery.limit(options.limit)
    }

    const { data, error } = await dbQuery
    if (error) throw error
    return (data as unknown as OrganizationListItem[]) || []
}

async function fetchUserSavedQuests(userId: string): Promise<string[]> {
    const { data, error } = await supabase
        .from('saved_courses')
        .select('course_id')
        .eq('user_id', userId)

    if (error) throw error
    return data?.map(c => c.course_id) || []
}

async function fetchUserSavedPaths(userId: string): Promise<string[]> {
    const { data, error } = await supabase
        .from('saved_paths')
        .select('path_id')
        .eq('user_id', userId)

    if (error) throw error
    return data?.map(p => p.path_id) || []
}

// ============================================================================
// SWR Hooks
// ============================================================================

/**
 * Hook to fetch and cache quests
 */
export function useQuests(options?: {
    query?: string
    validated?: boolean
    status?: 'published' | 'draft' | 'archived'
    limit?: number
}) {
    const key = options?.query
        ? `${SWR_KEYS.QUESTS}?q=${options.query}&status=${options.status || ''}&limit=${options.limit || ''}`
        : `${SWR_KEYS.QUESTS}?status=${options?.status || ''}&limit=${options?.limit || ''}`

    return useSWR(
        key,
        () => fetchQuests(options),
        SWR_CONFIG
    )
}

/**
 * Hook to fetch and cache paths
 */
export function usePaths(options?: {
    query?: string
    validated?: boolean
    limit?: number
}) {
    const key = options?.query
        ? `${SWR_KEYS.PATHS}?q=${options.query}&limit=${options.limit || ''}`
        : `${SWR_KEYS.PATHS}?limit=${options?.limit || ''}`

    return useSWR(
        key,
        () => fetchPaths(options),
        SWR_CONFIG
    )
}

/**
 * Hook to fetch and cache organizations
 */
export function useOrganizations(options?: {
    query?: string
    limit?: number
}) {
    const key = options?.query
        ? `${SWR_KEYS.ORGANIZATIONS}?q=${options.query}&limit=${options.limit || ''}`
        : `${SWR_KEYS.ORGANIZATIONS}?limit=${options?.limit || ''}`

    return useSWR(
        key,
        () => fetchOrganizations(options),
        SWR_CONFIG
    )
}

/**
 * Hook to fetch and cache user's saved quests
 */
export function useUserSavedQuests(userId: string | null) {
    return useSWR(
        userId ? SWR_KEYS.USER_SAVED_QUESTS(userId) : null,
        () => userId ? fetchUserSavedQuests(userId) : [],
        SWR_CONFIG
    )
}

/**
 * Hook to fetch and cache user's saved paths
 */
export function useUserSavedPaths(userId: string | null) {
    return useSWR(
        userId ? SWR_KEYS.USER_SAVED_PATHS(userId) : null,
        () => userId ? fetchUserSavedPaths(userId) : [],
        SWR_CONFIG
    )
}

/**
 * Combined search hook for explore page
 */
export function useExploreSearch(options: {
    query: string
    tab: 'all' | 'paths' | 'quests' | 'organizations'
}) {
    const key = SWR_KEYS.SEARCH(options.query, options.tab)

    return useSWR(
        key,
        async () => {
            const results: {
                paths: PathListItem[]
                quests: CourseListItem[]
                organizations: OrganizationListItem[]
            } = {
                paths: [],
                quests: [],
                organizations: []
            }

            const promises: Promise<void>[] = []

            if (options.tab === 'all' || options.tab === 'paths') {
                promises.push(
                    fetchPaths({
                        query: options.query || undefined,
                        validated: true,
                        limit: 20
                    }).then(data => { results.paths = data })
                )
            }

            if (options.tab === 'all' || options.tab === 'quests') {
                promises.push(
                    fetchQuests({
                        query: options.query || undefined,
                        validated: true,
                        status: 'published',
                        limit: 20
                    }).then(data => { results.quests = data })
                )
            }

            if (options.tab === 'all' || options.tab === 'organizations') {
                promises.push(
                    fetchOrganizations({
                        query: options.query || undefined,
                        limit: 10
                    }).then(data => { results.organizations = data })
                )
            }

            await Promise.all(promises)
            return results
        },
        {
            ...SWR_CONFIG,
            keepPreviousData: true, // Keep old data while fetching new
        }
    )
}

// ============================================================================
// Cache Invalidation Helpers
// ============================================================================

/**
 * Invalidate all quest-related caches
 */
export function invalidateQuests() {
    globalMutate(
        key => typeof key === 'string' && key.startsWith(SWR_KEYS.QUESTS),
        undefined,
        { revalidate: true }
    )
}

/**
 * Invalidate all path-related caches
 */
export function invalidatePaths() {
    globalMutate(
        key => typeof key === 'string' && key.startsWith(SWR_KEYS.PATHS),
        undefined,
        { revalidate: true }
    )
}

/**
 * Invalidate all organization-related caches
 */
export function invalidateOrganizations() {
    globalMutate(
        key => typeof key === 'string' && key.startsWith(SWR_KEYS.ORGANIZATIONS),
        undefined,
        { revalidate: true }
    )
}

/**
 * Invalidate user's saved items caches
 */
export function invalidateUserSaved(userId: string) {
    globalMutate(SWR_KEYS.USER_SAVED_QUESTS(userId))
    globalMutate(SWR_KEYS.USER_SAVED_PATHS(userId))
}

/**
 * Invalidate all search caches
 */
export function invalidateSearch() {
    globalMutate(
        key => typeof key === 'string' && key.startsWith('/api/search'),
        undefined,
        { revalidate: true }
    )
}

/**
 * Invalidate all caches (use sparingly)
 */
export function invalidateAll() {
    globalMutate(() => true, undefined, { revalidate: true })
}
