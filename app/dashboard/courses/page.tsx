import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { CardCourse } from '@/components/ui/CardCourse'


export const metadata = {
    title: 'Courses - MindBreaker',
    description: 'Browse and enroll in courses',
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

    // Fetch user-related courses
    // 1. Courses created by user
    const { data: createdCourses } = await supabase
        .from('courses')
        .select('id')
        .eq('created_by', user.id)

    // 2. Courses with progress
    const { data: progressCourses } = await supabase
        .from('user_course_progress')
        .select('course_id')
        .eq('user_id', user.id)

    // 3. Saved courses
    const { data: savedCourses } = await supabase
        .from('saved_courses')
        .select('course_id')
        .eq('user_id', user.id)

    // Combine all IDs
    const courseIds = new Set([
        ...(createdCourses?.map(c => c.id) || []),
        ...(progressCourses?.map(c => c.course_id) || []),
        ...(savedCourses?.map(c => c.course_id) || [])
    ])

    interface CourseListItem {
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

    let courses: CourseListItem[] = []

    if (courseIds.size > 0) {
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
            .in('id', Array.from(courseIds))
            .order('created_at', { ascending: false })

        courses = (data as unknown as CourseListItem[]) || []
    }

    // Filter courses based on status if filter is requested
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

    // Fetch creators for the displayed courses
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

    // Fetch user progress for map (simplified as we already have some in join but good for exact map)
    const { data: userProgress } = await supabase
        .from('user_course_progress')
        .select('course_id, completed')
        .eq('user_id', user.id)

    const progressMap = new Map(userProgress?.map(p => [p.course_id, p.completed]) || [])
    const savedSet = new Set(savedCourses?.map(s => s.course_id) || [])

    return (
        <>
            {/* Header Section */}
            <header className="flex flex-col gap-6 mb-8">
                <div className="flex flex-wrap justify-between items-end gap-6">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-gray-900 dark:text-white text-3xl font-black tracking-tight">My Courses</h2>
                        <p className="text-gray-600 dark:text-[#b0bfcc] text-base">
                            {courses.length} / {allCoursesCount} courses displayed
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            href="/dashboard/explore"
                            className="flex items-center gap-2 h-11 px-6 rounded-lg border border-gray-200 dark:border-[#3b4754] text-gray-900 dark:text-white font-medium transition-all hover:bg-gray-50 dark:hover:bg-[#283039]"
                        >
                            <span className="material-symbols-outlined w-5 h-5">search</span>
                            <span>Explore More</span>
                        </Link>
                        <Link
                            href="/dashboard/courses/new"
                            className="flex items-center gap-2 h-11 px-6 rounded-lg bg-[#137fec] text-gray-900 dark:text-white font-bold transition-all hover:bg-[#137fec]/80"
                        >
                            <span className="material-symbols-outlined w-5 h-5">add_circle</span>
                            <span>Create Course</span>
                        </Link>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 border-b border-gray-200 dark:border-[#3b4754] pb-1 overflow-x-auto">
                    <Link
                        href="/dashboard/courses"
                        className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${filter === 'all'
                            ? 'border-[#137fec] text-[#137fec]'
                            : 'border-transparent text-gray-600 dark:text-[#b0bfcc] hover:text-gray-900 dark:hover:text-white'
                            }`}
                    >
                        All
                    </Link>
                    <Link
                        href="/dashboard/courses?filter=published"
                        className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${filter === 'published'
                            ? 'border-[#137fec] text-[#137fec]'
                            : 'border-transparent text-gray-600 dark:text-[#b0bfcc] hover:text-gray-900 dark:hover:text-white'
                            }`}
                    >
                        Published
                    </Link>
                    <Link
                        href="/dashboard/courses?filter=pending"
                        className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${filter === 'pending'
                            ? 'border-amber-500 text-amber-500'
                            : 'border-transparent text-gray-600 dark:text-[#b0bfcc] hover:text-gray-900 dark:hover:text-white'
                            }`}
                    >
                        Pending
                    </Link>
                    <Link
                        href="/dashboard/courses?filter=draft"
                        className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${filter === 'draft'
                            ? 'border-[#137fec] text-[#137fec]'
                            : 'border-transparent text-gray-600 dark:text-[#b0bfcc] hover:text-gray-900 dark:hover:text-white'
                            }`}
                    >
                        Drafts
                    </Link>
                    <Link
                        href="/dashboard/courses?filter=archived"
                        className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${filter === 'archived'
                            ? 'border-[#137fec] text-[#137fec]'
                            : 'border-transparent text-gray-600 dark:text-[#b0bfcc] hover:text-gray-900 dark:hover:text-white'
                            }`}
                    >
                        Archived
                    </Link>
                </div>
            </header>

            {/* Courses Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {courses.length > 0 ? (
                    courses.map((course) => {
                        const isCompleted = progressMap.get(course.id) || false
                        const isEnrolled = progressMap.has(course.id)
                        const isSaved = savedSet.has(course.id)

                        // Status Logic
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
                                progress={isEnrolled ? (isCompleted ? 100 : 10) : 0} // Approximate progress based on boolean
                                isSaved={isSaved}
                                instructor={course.organizations && course.organizations.length > 0 ? course.organizations[0].name : (creatorMap.get(course.created_by) ? `by ${creatorMap.get(course.created_by)}` : undefined)}
                                variant="grid"
                            />
                        )
                    })
                ) : (
                    <div className="col-span-full bg-white dark:bg-[#1a232e] rounded-xl border border-gray-200 dark:border-[#3b4754] p-12 text-center">
                        <span className="material-symbols-outlined w-16 h-16 text-[#3b4754] mx-auto mb-4">school</span>
                        <p className="text-gray-600 dark:text-[#b0bfcc] text-lg mb-2">No courses found</p>
                        <p className="text-gray-600 dark:text-[#b0bfcc] text-sm mb-4">
                            {filter !== 'all' ? `No ${filter} courses found.` : "You haven't enrolled in, saved, or created any courses yet."}
                        </p>
                        <Link
                            href="/dashboard/explore"
                            className="inline-block bg-[#137fec] hover:bg-[#137fec]/80 text-gray-900 dark:text-white px-6 py-2 rounded-lg font-bold text-sm transition-colors"
                        >
                            Explore Courses
                        </Link>
                    </div>
                )}
            </div>
        </>
    )
}
