import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { ValidationPanel } from './ValidationPanel'
import { EditRequest } from '@/lib/types'

export const metadata = {
    title: 'Content Validation - MindBreaker Admin',
    description: 'Review and validate new content submissions',
}

export default async function AdminValidationsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Check if user is admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

    if (!profile?.is_admin) {
        redirect('/dashboard')
    }

    // Fetch unvalidated items AND items with pending draft_data
    const [coursesRes, draftCoursesRes, orgsRes, pathsRes, editRequestsRes] = await Promise.all([
        // 1. New Courses (not validated)
        supabase
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
            .order('created_at', { ascending: false }),

        // 2. Existing Courses with Draft Data (Shadow Drafts)
        supabase
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
            .not('draft_data', 'is', null) // Fetch where draft_data is NOT null
            .eq('is_validated', true) // Only validated courses that have NEW drafts
            .order('created_at', { ascending: false }),

        supabase
            .from('organizations')
            .select('id, name, description, website_url, is_validated, created_at')
            .eq('is_validated', false)
            .order('created_at', { ascending: false }),

        supabase
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
            .order('created_at', { ascending: false }),

        supabase
            .from('edit_requests')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
    ])

    // Combine courses
    const allPendingCourses = [
        ...(coursesRes.data || []),
        ...(draftCoursesRes.data || [])
    ]

    // Fetch all existing validated items for fuzzy matching
    const [existingOrgsRes, existingCoursesRes, existingPathsRes] = await Promise.all([
        supabase.from('organizations').select('id, name').eq('is_validated', true),
        supabase.from('courses').select('id, title').eq('is_validated', true),
        supabase.from('learning_paths').select('id, title').eq('is_validated', true),
    ])

    const pendingItems = {
        courses: allPendingCourses,
        organizations: orgsRes.data || [],
        paths: pathsRes.data || [],
        edits: (editRequestsRes.data || []) as EditRequest[],
    }

    const existingItems = {
        organizations: existingOrgsRes.data?.map(o => ({ id: o.id, name: o.name })) || [],
        courses: existingCoursesRes.data?.map(c => ({ id: c.id, name: c.title })) || [],
        paths: existingPathsRes.data?.map(p => ({ id: p.id, name: p.title })) || [],
    }

    const totalPending =
        pendingItems.courses.length +
        pendingItems.organizations.length +
        pendingItems.paths.length +
        pendingItems.edits.length

    return (
        <>
            <header className="mb-8">
                <Link
                    href="/dashboard"
                    className="text-sm text-muted dark:text-muted hover:text-brand mb-4 inline-flex items-center gap-1 transition-colors"
                >
                    <span className="material-symbols-outlined text-base">arrow_back</span>
                    Dashboard
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-text-main dark:text-text-main">Content Validation</h1>
                        <p className="text-muted dark:text-muted mt-2">
                            Review and approve new content before it appears to all users
                        </p>
                    </div>
                    {totalPending > 0 && (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500/20 border border-yellow-500/30">
                            <span className="material-symbols-outlined text-yellow-400">pending</span>
                            <span className="text-yellow-400 font-medium">{totalPending} pending</span>
                        </div>
                    )}
                </div>
            </header>

            <ValidationPanel
                pendingItems={pendingItems}
                existingItems={existingItems}
            />
        </>
    )
}
