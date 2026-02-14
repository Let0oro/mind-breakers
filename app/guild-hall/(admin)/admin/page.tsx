import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import {
    getPendingValidationsCached,
    getPendingSubmissionsCached,
    getPendingAdminRequestsCountCached,
    getRecentPendingQuestsCached,
    getRecentPendingSubmissionsCached,
    getRecentAdminRequestsCached
} from '@/lib/cache'

export const metadata = {
    title: 'Admin Dashboard - MindBreaker',
    description: 'Admin overview for validations, submissions, and requests',
}

export default async function AdminDashboardPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

    if (!profile?.is_admin) {
        redirect('/guild-hall')
    }

    // Use all cached queries
    const [
        pendingValidations,
        pendingSubmissions,
        pendingRequests,
        recentCourses,
        recentSubmissions,
        recentRequests
    ] = await Promise.all([
        getPendingValidationsCached(supabase),
        getPendingSubmissionsCached(supabase),
        getPendingAdminRequestsCountCached(supabase),
        getRecentPendingQuestsCached(supabase, 3),
        getRecentPendingSubmissionsCached(supabase, 3),
        getRecentAdminRequestsCached(supabase, 3)
    ])

    const validationCount = pendingValidations.total
    const submissionCount = pendingSubmissions
    const requestCount = pendingRequests

    const sections = [
        {
            title: 'Content Validation',
            description: 'Review and approve new courses, paths, and organizations',
            icon: 'verified',
            href: '/guild-hall/admin/validations',
            count: validationCount,
            color: 'amber',
            preview: recentCourses.map(c => ({
                label: c.title,
                sub: new Date(c.created_at).toLocaleDateString()
            }))
        },
        {
            title: 'Exercise Submissions',
            description: 'Review student submissions for exercises',
            icon: 'assignment_turned_in',
            href: '/guild-hall/admin/submissions',
            count: submissionCount,
            color: 'purple',
            preview: recentSubmissions.map(s => ({
                label: Array.isArray(s.course_exercises) ? s.course_exercises[0]?.title : (s.course_exercises as { title: string })?.title || 'Exercise',
                sub: new Date(s.submitted_at).toLocaleDateString()
            }))
        },
        {
            title: 'Admin Requests',
            description: 'Manage requests for administrator privileges',
            icon: 'admin_panel_settings',
            href: '/guild-hall/admin/requests',
            count: requestCount,
            color: 'cyan',
            preview: recentRequests.map(r => ({
                label: Array.isArray(r.profiles) ? r.profiles[0]?.username : (r.profiles as { username: string })?.username || 'User',
                sub: new Date(r.created_at).toLocaleDateString()
            }))
        }
    ]

    const totalPending = validationCount + submissionCount + requestCount

    return (
        <>
            <header className="mb-10">
                <h1 className="text-5xl font-header text-foreground tracking-tight mb-1">
                    Admin Dashboard
                </h1>
                <p className="text-muted text-sm">
                    Manage platform content, submissions, and access requests
                </p>
            </header>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                <div className="border border-border bg-main p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted mb-1">Total Pending</p>
                    <p className="text-3xl font-black text-text-main">{totalPending}</p>
                </div>
                <div className="border border-amber-500/30 bg-main p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-1">Validations</p>
                    <p className="text-3xl font-black text-text-main">{validationCount}</p>
                </div>
                <div className="border border-purple-500/30 bg-main p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-purple-500 mb-1">Submissions</p>
                    <p className="text-3xl font-black text-text-main">{submissionCount}</p>
                </div>
                <div className="border border-cyan-500/30 bg-main p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-cyan-500 mb-1">Requests</p>
                    <p className="text-3xl font-black text-text-main">{requestCount}</p>
                </div>
            </div>

            {/* Section Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {sections.map((section) => (
                    <Link
                        key={section.title}
                        href={section.href}
                        className={`group border bg-main p-6 hover:border-${section.color}-500/50 transition-all ${section.count > 0 ? `border-${section.color}-500/30` : 'border-border'
                            }`}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 border border-${section.color}-500/30`}>
                                <span className={`material-symbols-outlined text-2xl text-${section.color}-500`}>
                                    {section.icon}
                                </span>
                            </div>
                            {section.count > 0 && (
                                <span className={`px-2 py-1 text-xs font-bold uppercase tracking-widest bg-${section.color}-500/20 text-${section.color}-500`}>
                                    {section.count} pending
                                </span>
                            )}
                        </div>

                        <h2 className="text-lg font-bold text-text-main mb-1 group-hover:underline">
                            {section.title}
                        </h2>
                        <p className="text-muted text-sm mb-4">
                            {section.description}
                        </p>

                        {/* Preview Items */}
                        {section.preview.length > 0 && (
                            <div className="border-t border-border pt-4 space-y-2">
                                {section.preview.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs">
                                        <span className="text-text-main truncate max-w-[180px]">{item.label}</span>
                                        <span className="text-muted shrink-0">{item.sub}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-4 flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-muted group-hover:text-text-main transition-colors">
                            View All
                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </div>
                    </Link>
                ))}
            </div>
        </>
    )
}
