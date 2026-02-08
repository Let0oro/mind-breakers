import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { ValidationPanel } from './ValidationPanel'
import { EditRequest } from '@/lib/types'
import {
    getPendingQuestsListCached,
    getQuestsWithDraftEditsCached,
    getPendingOrgsListCached,
    getPendingPathsListCached,
    getPendingEditRequestsCached
} from '@/lib/cache'

export const metadata = {
    title: 'Content Validation - MindBreaker Admin',
    description: 'Review and validate new content submissions',
}

export default async function AdminValidationsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

    if (!profile?.is_admin) {
        redirect('/dashboard')
    }

    // Use cached queries
    const [pendingCourses, draftCourses, pendingOrgs, pendingPaths, editRequests] = await Promise.all([
        getPendingQuestsListCached(supabase),
        getQuestsWithDraftEditsCached(supabase),
        getPendingOrgsListCached(supabase),
        getPendingPathsListCached(supabase),
        getPendingEditRequestsCached(supabase)
    ])

    const allPendingCourses = [...pendingCourses, ...draftCourses]

    // Fetch existing validated items for duplicates check (still needs real-time data)
    const [existingOrgsRes, existingCoursesRes, existingPathsRes] = await Promise.all([
        supabase.from('organizations').select('id, name').eq('is_validated', true),
        supabase.from('courses').select('id, title').eq('is_validated', true),
        supabase.from('learning_paths').select('id, title').eq('is_validated', true),
    ])

    const pendingItems = {
        courses: allPendingCourses,
        organizations: pendingOrgs,
        paths: pendingPaths,
        edits: editRequests as EditRequest[],
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
                    className="text-xs font-bold uppercase tracking-widest text-muted hover:text-text-main mb-4 inline-flex items-center gap-1 transition-colors"
                >
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    Dashboard
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tight text-text-main">
                            Content Validation
                        </h1>
                        <p className="text-muted text-sm mt-1">
                            Review and approve new content before it appears to all users
                        </p>
                    </div>
                    {totalPending > 0 && (
                        <div className="flex items-center gap-2 px-4 py-2 border border-amber-500/30">
                            <span className="material-symbols-outlined text-amber-500">pending</span>
                            <span className="text-amber-500 text-xs font-bold uppercase tracking-widest">{totalPending} pending</span>
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
