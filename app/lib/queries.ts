/**
 * Centralized Supabase query functions for reuse across pages
 * These functions work with both server and client Supabase instances
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { PathListItem } from './types'

// ============================================================================
// Types
// ============================================================================

export interface CourseListItem {
    id: string
    title: string
    summary?: string
    thumbnail_url?: string
    xp_reward: number
    is_validated?: boolean
    created_by: string
    status: 'draft' | 'published' | 'archived'
    organizations: { name: string }[] | null
    user_course_progress?: { completed: boolean; xp_earned: number }[]
    saved_courses?: { user_id: string }[]
}

export interface OrganizationListItem {
    id: string
    name: string
    description?: string
    website_url?: string
    is_validated: boolean
    created_by?: string
    learning_paths?: { id: string }[]
    courses?: { id: string }[]
}

export interface ExerciseListItem {
    id: string
    title: string
    description?: string
    status: 'completed' | 'in_progress' | 'pending_review' | 'not_started'
    xp_reward: number
    course_title?: string
    course_id?: string
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
    courses: CourseListItem[]
    paths: PathListItem[]
    organizations: OrganizationListItem[]
    savedCourseIds: Set<string>
    savedPathIds: Set<string>
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
 * Get user's saved course IDs
 */
export async function getUserSavedCourses(
    supabase: SupabaseClient,
    userId: string
): Promise<string[]> {
    const { data } = await supabase
        .from('saved_courses')
        .select('course_id')
        .eq('user_id', userId)

    return data?.map(c => c.course_id) || []
}

/**
 * Get user's saved path IDs
 */
export async function getUserSavedPaths(
    supabase: SupabaseClient,
    userId: string
): Promise<string[]> {
    const { data } = await supabase
        .from('saved_paths')
        .select('path_id')
        .eq('user_id', userId)

    return data?.map(p => p.path_id) || []
}

/**
 * Get user's course progress IDs
 */
export async function getUserProgressCourses(
    supabase: SupabaseClient,
    userId: string
): Promise<string[]> {
    const { data } = await supabase
        .from('user_course_progress')
        .select('course_id')
        .eq('user_id', userId)

    return data?.map(c => c.course_id) || []
}

/**
 * Get user's created course IDs
 */
export async function getUserCreatedCourses(
    supabase: SupabaseClient,
    userId: string
): Promise<string[]> {
    const { data } = await supabase
        .from('courses')
        .select('id')
        .eq('created_by', userId)

    return data?.map(c => c.id) || []
}

/**
 * Get user's created path IDs
 */
export async function getUserCreatedPaths(
    supabase: SupabaseClient,
    userId: string
): Promise<string[]> {
    const { data } = await supabase
        .from('learning_paths')
        .select('id')
        .eq('created_by', userId)

    return data?.map(p => p.id) || []
}

// ============================================================================
// Course Queries
// ============================================================================

/**
 * Get courses by IDs with full details
 */
export async function getCoursesByIds(
    supabase: SupabaseClient,
    courseIds: string[],
    options?: {
        includeProgress?: boolean
        includeSaved?: boolean
        status?: 'draft' | 'published' | 'archived'
        limit?: number
    }
): Promise<CourseListItem[]> {
    if (courseIds.length === 0) return []

    let query = supabase
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
            ${options?.includeProgress ? ', user_course_progress (completed, xp_earned)' : ''}
            ${options?.includeSaved ? ', saved_courses (user_id)' : ''}
        `)
        .in('id', courseIds)
        .order('created_at', { ascending: false })

    if (options?.status) {
        query = query.eq('status', options.status)
    }

    if (options?.limit) {
        query = query.limit(options.limit)
    }

    const { data } = await query
    return (data as unknown as CourseListItem[]) || []
}

/**
 * Get user's draft courses
 */
export async function getUserDrafts(
    supabase: SupabaseClient,
    userId: string,
    limit?: number
): Promise<DraftItem[]> {
    let query = supabase
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
        query = query.limit(limit)
    }

    const { data } = await query
    return (data as DraftItem[]) || []
}

/**
 * Search courses with optional filters
 */
export async function searchCourses(
    supabase: SupabaseClient,
    options?: {
        query?: string
        validated?: boolean
        status?: 'published' | 'draft' | 'archived'
        limit?: number
    }
): Promise<CourseListItem[]> {
    let dbQuery = supabase
        .from('courses')
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
    return (data as unknown as CourseListItem[]) || []
}

// ============================================================================
// Path Queries
// ============================================================================

/**
 * Get paths by IDs with full details
 */
export async function getPathsByIds(
    supabase: SupabaseClient,
    pathIds: string[],
    limit?: number
): Promise<PathListItem[]> {
    if (pathIds.length === 0) return []

    let query = supabase
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
            courses (id)
        `)
        .in('id', pathIds)
        .order('created_at', { ascending: false })

    if (limit) {
        query = query.limit(limit)
    }

    const { data } = await query
    return data || []
}

/**
 * Search paths with optional filters
 */
export async function searchPaths(
    supabase: SupabaseClient,
    options?: {
        query?: string
        validated?: boolean
        limit?: number
    }
): Promise<PathListItem[]> {
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
            learning_paths (id),
            courses (id)
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
        .select(`id, name, description, learning_paths (id), courses (id)`)
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
    const { data: enrolledCourses } = await supabase
        .from('user_course_progress')
        .select('course_id')
        .eq('user_id', userId)

    if (!enrolledCourses || enrolledCourses.length === 0) {
        return { total: 0, completed: 0, pending: 0 }
    }

    const { count: totalExercises } = await supabase
        .from('course_exercises')
        .select('id', { count: 'exact' })
        .in('course_id', enrolledCourses.map(c => c.course_id))

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
        courses?: number
        paths?: number
        organizations?: number
    }
): Promise<UserLibraryData> {
    // Parallel fetch of all user-related IDs
    const [
        savedCourseIds,
        savedPathIds,
        progressCourseIds,
        createdCourseIds,
        createdPathIds,
        drafts,
        organizations,
        exerciseStats
    ] = await Promise.all([
        getUserSavedCourses(supabase, userId),
        getUserSavedPaths(supabase, userId),
        getUserProgressCourses(supabase, userId),
        getUserCreatedCourses(supabase, userId),
        getUserCreatedPaths(supabase, userId),
        getUserDrafts(supabase, userId, limits?.drafts),
        getOrganizations(supabase, userId, limits?.organizations),
        getUserExerciseStats(supabase, userId)
    ])

    // Combine IDs for courses and paths
    const allCourseIds = new Set([
        ...savedCourseIds,
        ...progressCourseIds,
        ...createdCourseIds.filter(id => {
            // Filter out drafts since they're already fetched
            return !drafts.some(d => d.id === id)
        })
    ])

    const allPathIds = new Set([
        ...savedPathIds,
        ...createdPathIds
    ])

    // Fetch courses and paths
    const [courses, paths] = await Promise.all([
        getCoursesByIds(supabase, Array.from(allCourseIds), {
            status: 'published',
            limit: limits?.courses
        }),
        getPathsByIds(supabase, Array.from(allPathIds), limits?.paths)
    ])

    return {
        drafts,
        courses,
        paths,
        organizations,
        savedCourseIds: new Set(savedCourseIds),
        savedPathIds: new Set(savedPathIds),
        exerciseStats
    }
}

/**
 * Get explore page data with search
 * Optimized for the Explore page
 */
export async function getExploreData(
    supabase: SupabaseClient,
    options?: {
        query?: string
        tab?: 'all' | 'paths' | 'courses' | 'organizations'
        limit?: number
    }
): Promise<{
    paths: PathListItem[]
    courses: CourseListItem[]
    organizations: OrganizationListItem[]
}> {
    const tab = options?.tab || 'all'
    const limit = options?.limit || 20

    const results: {
        paths: PathListItem[]
        courses: CourseListItem[]
        organizations: OrganizationListItem[]
    } = {
        paths: [],
        courses: [],
        organizations: []
    }

    const promises: Promise<void>[] = []

    if (tab === 'all' || tab === 'paths') {
        promises.push(
            searchPaths(supabase, {
                query: options?.query,
                validated: true,
                limit
            }).then(data => { results.paths = data })
        )
    }

    if (tab === 'all' || tab === 'courses') {
        promises.push(
            searchCourses(supabase, {
                query: options?.query,
                validated: true,
                status: 'published',
                limit
            }).then(data => { results.courses = data })
        )
    }

    if (tab === 'all' || tab === 'organizations') {
        promises.push(
            searchOrganizations(supabase, {
                query: options?.query,
                limit: 10
            }).then(data => { results.organizations = data })
        )
    }

    await Promise.all(promises)

    return results
}
