import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { CardCourse } from '@/components/ui/CardCourse'
import {
    getUserSavedQuestsCached,
    getUserProgressCached,
    getUserCreatedQuestIdsCached,
    getQuestsByIdsCached
} from '@/lib/cache'

export const metadata = {
    title: 'Courses - MindBreaker',
    description: 'Browse and enroll in courses',
}

interface QuestItem {
    id: string
    title: string
    summary?: string
    thumbnail_url?: string
    xp_reward: number
    is_validated?: boolean
    created_by: string
    status: 'draft' | 'published' | 'archived'
    organizations: { name: string }[] | null
    user_course_progress: { completed: boolean, xp_earned: number }[]
    saved_courses: { user_id: string }[]
}

export default async function CoursesPage({
    searchParams,
}: {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const supabase = await createClient()
    const resolvedSearchParams = await searchParams
    const filter = (resolvedSearchParams?.filter as string) || 'all'

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) redirect('/login')

    // Use all cached queries for user data
    const [savedCourseIds, userProgress, createdCourseIds] = await Promise.all([
        getUserSavedQuestsCached(supabase, user.id),
        getUserProgressCached(supabase, user.id),
        getUserCreatedQuestIdsCached(supabase, user.id)
    ])

    const progressCourseIds = userProgress.map(c => c.course_id)

    // Combine all course IDs
    const courseIds = [...new Set([
        ...createdCourseIds,
        ...progressCourseIds,
        ...savedCourseIds
    ])]

    // Fetch courses by IDs (cached)
    let courses = (await getQuestsByIdsCached(supabase, courseIds)) as QuestItem[]

    const allCoursesCount = courses.length
    if (filter !== 'all') {
        courses = courses.filter(course => {
            if (filter === 'pending') return course.is_validated === false && course.status !== 'draft'
            if (filter === 'published') return course.status === 'published' && course.is_validated === true
            if (filter === 'draft') return course.status === 'draft'
            if (filter === 'archived') return course.status === 'archived'
            return true
        })
    }

    const creatorIds = Array.from(new Set(courses.map(c => c.created_by).filter(Boolean)))
    let creatorMap = new Map<string, string>()

    if (creatorIds.length > 0) {
        const { data: creators } = await supabase
            .from('profiles')
            .select('id, username')
            .in('id', creatorIds)

        if (creators) {
            creatorMap = new Map(creators.map(p => [p.id, p.username]))
        }
    }

    const progressMap = new Map(userProgress.map(p => [p.course_id, p.completed]))
    const savedSet = new Set(savedCourseIds)

    const tabs = [
        { key: 'all', label: 'ALL', href: '/dashboard/quests' },
        { key: 'published', label: 'PUBLISHED', href: '/dashboard/quests?filter=published' },
        { key: 'pending', label: 'PENDING', href: '/dashboard/quests?filter=pending' },
        { key: 'draft', label: 'DRAFTS', href: '/dashboard/quests?filter=draft' },
        { key: 'archived', label: 'ARCHIVED', href: '/dashboard/quests?filter=archived' },
    ]

    return (
        <>
            {/* Header */}
            <header className="mb-10">
                <div className="flex flex-wrap justify-between items-end gap-6 mb-6">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-text-main text-4xl font-black italic tracking-tight">COURSES</h1>
                        <p className="text-muted text-sm">
                            {courses.length} / {allCoursesCount} courses displayed
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link
                            href="/dashboard/explore"
                            className="flex items-center gap-2 px-4 py-2 border border-border text-xs font-bold uppercase tracking-widest text-muted hover:border-text-main hover:text-text-main transition-all"
                        >
                            <span className="material-symbols-outlined text-lg">search</span>
                            <span>Explore</span>
                        </Link>
                        <Link
                            href="/dashboard/quests/new"
                            className="flex items-center gap-2 px-4 py-2 border border-text-main bg-inverse text-main-alt text-xs font-bold uppercase tracking-widest hover:bg-text-main transition-all"
                        >
                            <span className="material-symbols-outlined text-lg">add</span>
                            <span>Create</span>
                        </Link>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-6 border-b border-border">
                    {tabs.map((tab) => (
                        <Link
                            key={tab.key}
                            href={tab.href}
                            className={`pb-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${filter === tab.key
                                ? 'border-text-main text-text-main'
                                : 'border-transparent text-muted hover:text-text-main'
                                }`}
                        >
                            {tab.label}
                        </Link>
                    ))}
                </div>
            </header>

            {/* Courses Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {courses.length > 0 ? (
                    courses.map((course) => {
                        const isCompleted = progressMap.get(course.id) || false
                        const isEnrolled = progressMap.has(course.id)
                        const isSaved = savedSet.has(course.id)

                        const isPublished = course.status === 'published'
                        const isPending = isPublished && !course.is_validated

                        return (
                            <CardCourse
                                key={course.id}
                                id={course.id}
                                title={course.title}
                                thumbnail_url={course.thumbnail_url}
                                xp_reward={course.xp_reward}
                                summary={course.summary}
                                status={isPending ? 'pending' : course.status}
                                progress={isEnrolled ? (isCompleted ? 100 : 10) : 0}
                                isSaved={isSaved}
                                instructor={course.organizations && course.organizations.length > 0 ? course.organizations[0].name : (creatorMap.get(course.created_by) ? `by ${creatorMap.get(course.created_by)}` : undefined)}
                                variant="grid"
                            />
                        )
                    })
                ) : (
                    <div className="col-span-full border border-border p-12 text-center">
                        <span className="material-symbols-outlined text-5xl text-muted mb-4 block">school</span>
                        <p className="text-muted text-sm mb-1">No courses found</p>
                        <p className="text-muted text-xs mb-6">
                            {filter !== 'all' ? `No ${filter} courses.` : "Start by exploring or creating a course."}
                        </p>
                        <Link
                            href="/dashboard/explore"
                            className="inline-block px-4 py-2 border border-text-main text-text-main text-xs font-bold uppercase tracking-widest hover:bg-inverse hover:text-main-alt transition-all"
                        >
                            Explore Courses
                        </Link>
                    </div>
                )}
            </div>
        </>
    )
}
