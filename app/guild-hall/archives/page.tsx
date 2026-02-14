import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { CardCourse } from '@/components/ui/CardCourse'
import { CardPath } from '@/components/ui/CardPath'
import { getUserLibraryData } from '@/lib/queries'

export const metadata = {
    title: 'Library - MindBreaker',
    description: 'Your personal learning library',
}

// Section component extracted outside of render
function Section({
    title,
    icon,
    href,
    count,
    children,
    emptyMessage,
    createHref,
    createLabel
}: {
    title: string
    icon: string
    href: string
    count: number
    children: React.ReactNode
    emptyMessage: string
    createHref?: string
    createLabel?: string
}) {
    return (
        <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-muted">{icon}</span>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-text-main">
                        {title}
                    </h2>
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-surface text-muted">
                        {count}
                    </span>
                </div>
                <div className="flex items-center gap-10">
                    {createHref && (
                        <Link
                            href={createHref}
                            className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-muted hover:text-text-main transition-colors"
                        >
                            <span className="material-symbols-outlined text-sm">add</span>
                            {createLabel || 'Create'}
                        </Link>
                    )}
                    <Link
                        href={href}
                        className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-muted hover:text-text-main transition-colors"
                    >
                        View All
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                </div>
            </div>
            {count > 0 ? children : (
                <div className="border border-border bg-main p-8 text-center">
                    <p className="text-muted text-sm">{emptyMessage}</p>
                </div>
            )}
        </section>
    )
}

export default async function LibraryPage() {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) redirect('/login')

    // Fetch all library data using centralized query function
    const libraryData = await getUserLibraryData(supabase, user.id, {
        drafts: 4,
        courses: 4,
        paths: 4,
        organizations: 6
    })

    const { drafts, courses, paths, organizations, savedPathIds, exerciseStats } = libraryData

    return (
        <>
            <header className="mb-10">
                <h1 className="text-5xl font-header text-foreground tracking-tight mb-1">
                    Archives
                </h1>
                <p className="text-muted text-sm">
                    Your personal history
                </p>
            </header>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                <div className="border border-border bg-main p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted mb-1">Quests</p>
                    <p className="text-3xl font-black text-text-main">{courses.length}</p>
                </div>
                <div className="border border-border bg-main p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted mb-1">expeditions</p>
                    <p className="text-3xl font-black text-text-main">{paths.length}</p>
                </div>
                <div className="border border-border bg-main p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted mb-1">Drafts</p>
                    <p className="text-3xl font-black text-text-main">{drafts.length}</p>
                </div>
                <div className="border border-border bg-main p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted mb-1">Missions Done</p>
                    <p className="text-3xl font-black text-text-main">{exerciseStats.completed}/{exerciseStats.total}</p>
                </div>
            </div>

            {/* Drafts Section */}
            <Section
                title="My Drafts"
                icon="edit_note"
                href="/guild-hall/drafts"
                count={drafts.length}
                emptyMessage="No drafts. Start creating a course!"
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {drafts.map((draft) => (
                        <CardCourse
                            key={draft.id}
                            id={draft.id}
                            title={draft.title}
                            thumbnail_url={draft.thumbnail_url}
                            xp_reward={draft.xp_reward}
                            summary={draft.summary || undefined}
                            status={draft.status}
                            variant="draft"
                            href={`/guild-hall/drafts/${draft.id}/edit`}
                        />
                    ))}
                </div>
            </Section>

            {/* Courses Section */}
            <Section
                title="My Quests"
                icon="school"
                href="/guild-hall/quests"
                count={courses.length}
                createHref="/guild-hall/quests/new"
                createLabel="New"
                emptyMessage="No courses yet. Explore and enroll in some!"
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {courses.map((course) => (
                        <CardCourse
                            key={course.id}
                            id={course.id}
                            title={course.title}
                            thumbnail_url={course.thumbnail_url}
                            xp_reward={course.xp_reward}
                            summary={course.summary}
                            status={course.status}
                            instructor={course.organizations?.[0]?.name}
                            variant="grid"
                        />
                    ))}
                </div>
            </Section>

            {/* Paths Section */}
            <Section
                title="My expeditions"
                icon="route"
                href="/guild-hall/expeditions"
                count={paths.length}
                emptyMessage="No expeditions saved. Discover learning paths!"
                createHref="/guild-hall/expeditions/new"
                createLabel="New"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paths.map((path) => {
                        const courseCount = path.courses?.length || 0
                        const org = Array.isArray(path.organizations) ? path.organizations[0] : path.organizations

                        return (
                            <CardPath
                                key={path.id}
                                id={path.id}
                                title={path.title}
                                summary={path.summary}
                                completedCourses={0}
                                totalCourses={courseCount}
                                progressPercent={0}
                                isSaved={savedPathIds.has(path.id)}
                                isValidated={path.is_validated}
                                isOwner={path.created_by === user.id}
                                organizationName={org?.name}
                                variant="card"
                            />
                        )
                    })}
                </div>
            </Section>

            {/* Organizations Section */}
            <Section
                title="Organizations"
                icon="corporate_fare"
                href="/guild-hall/organizations"
                count={organizations.length}
                emptyMessage="No organizations found."
                createHref="/guild-hall/organizations/new"
                createLabel="New"
            >
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {organizations.map((org) => (
                        <Link
                            key={org.id}
                            href={`/guild-hall/paths?org=${org.id}`}
                            className="border border-border bg-main p-4 hover:border-text-main transition-colors group"
                        >
                            <div className="w-10 h-10 border border-border flex items-center justify-center mb-3">
                                <span className="text-lg font-bold text-text-main">
                                    {org.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <h3 className="text-sm font-bold text-text-main truncate group-hover:underline">
                                {org.name}
                            </h3>
                            {!org.is_validated && (
                                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">
                                    Pending
                                </span>
                            )}
                        </Link>
                    ))}
                </div>
            </Section>

            {/* Exercises Quick Link */}
            <section className="mb-10">
                <Link
                    href="/guild-hall/missions"
                    className="block border border-border bg-main p-6 hover:border-text-main transition-colors group"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 border border-border">
                                <span className="material-symbols-outlined text-2xl text-text-main">assignment</span>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-text-main group-hover:underline">Missions</h2>
                                <p className="text-muted text-sm">Practice and apply what you&apos;ve learned</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <p className="text-2xl font-black text-text-main">{exerciseStats.completed}</p>
                                <p className="text-xs font-bold uppercase tracking-widest text-muted">Completed</p>
                            </div>
                            {exerciseStats.pending > 0 && (
                                <div className="text-right">
                                    <p className="text-2xl font-black text-amber-500">{exerciseStats.pending}</p>
                                    <p className="text-xs font-bold uppercase tracking-widest text-amber-500">Pending</p>
                                </div>
                            )}
                            <span className="material-symbols-outlined text-muted group-hover:text-text-main transition-colors">
                                arrow_forward
                            </span>
                        </div>
                    </div>
                </Link>
            </section>
        </>
    )
}
