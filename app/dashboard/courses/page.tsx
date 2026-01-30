import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'


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
                        const isOwner = course.created_by === user.id

                        // Status Logic
                        const isDraft = course.status === 'draft'
                        const isArchived = course.status === 'archived'
                        const isPublished = course.status === 'published'
                        const isPending = isPublished && !course.is_validated

                        return (
                            <Link
                                key={course.id}
                                href={`/dashboard/courses/${course.id}`}
                                className="group bg-white dark:bg-[#1a232e] rounded-xl overflow-hidden border border-gray-200 dark:border-[#3b4754] hover:border-[#137fec]/50 transition-all cursor-pointer flex flex-col relative"
                            >
                                {/* Thumbnail */}
                                <div className="h-40 bg-gradient-to-br from-[#137fec]/20 to-[#137fec]/5 relative overflow-hidden shrink-0">
                                    {course.thumbnail_url ? (
                                        <img
                                            src={course.thumbnail_url}
                                            alt={course.title}
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="material-symbols-outlined w-16 h-16 text-[#137fec]/30">school</span>
                                        </div>
                                    )}

                                    <div className="absolute top-2 right-2 flex flex-col gap-2 items-end">
                                        {/* Progress Badges */}
                                        {isCompleted && (
                                            <div className="bg-green-500 text-gray-900 dark:text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                                                Created
                                            </div>
                                        )}
                                        {!isCompleted && isEnrolled && (
                                            <div className="bg-[#137fec] text-gray-900 dark:text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                                                In Progress
                                            </div>
                                        )}
                                        {isSaved && !isEnrolled && (
                                            <div className="bg-gray-900/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm border border-white/10">
                                                <span className="material-symbols-outlined w-3 h-3">bookmark</span>
                                                Saved
                                            </div>
                                        )}

                                        {/* Status Badges (Owner only) */}
                                        {isOwner && (
                                            <>
                                                {isDraft && (
                                                    <div className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-yellow-100 text-yellow-800">
                                                        Draft
                                                    </div>
                                                )}
                                                {isArchived && (
                                                    <div className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-800">
                                                        Archived
                                                    </div>
                                                )}
                                                {isPending && (
                                                    <div className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800 animate-pulse">
                                                        Pending
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-5 flex flex-col gap-3 flex-1">
                                    <h4 className="font-bold text-base line-clamp-2 text-gray-900 dark:text-white group-hover:text-[#137fec] transition-colors">
                                        {course.title}
                                    </h4>

                                    {course.summary && (
                                        <p className="text-gray-600 dark:text-[#b0bfcc] text-sm line-clamp-2">
                                            {course.summary}
                                        </p>
                                    )}

                                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-200 dark:border-[#3b4754]">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined w-4 h-4 text-[#137fec]">star</span>
                                            <span className="text-gray-600 dark:text-[#b0bfcc] text-xs font-medium">{course.xp_reward} XP</span>
                                        </div>

                                        {course.organizations && course.organizations.length > 0 && (
                                            <span className="text-gray-600 dark:text-[#b0bfcc] text-xs">{course.organizations[0].name}</span>
                                        )}
                                    </div>
                                </div>
                            </Link>
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
