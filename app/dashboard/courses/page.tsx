import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
    title: 'Courses - MindBreaker',
    description: 'Browse and enroll in courses',
}

export default async function CoursesPage() {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) redirect('/login')

    // Fetch all courses
    const { data: courses } = await supabase
        .from('courses')
        .select(`
      id,
      title,
      summary,
      thumbnail_url,
      xp_reward,
      organizations (name),
      user_course_progress (
        completed,
        xp_earned
      )
    `)
        .order('created_at', { ascending: false })

    // Fetch user progress
    const { data: userProgress } = await supabase
        .from('user_course_progress')
        .select('course_id, completed')
        .eq('user_id', user.id)

    const progressMap = new Map(userProgress?.map(p => [p.course_id, p.completed]) || [])

    return (
        <>
            {/* Header Section */}
            <header className="flex flex-wrap justify-between items-end gap-6 mb-8">
                <div className="flex flex-col gap-2">
                    <h2 className="text-white text-3xl font-black tracking-tight">All Courses</h2>
                    <p className="text-[#9dabb9] text-base">
                        {courses?.length || 0} courses available
                    </p>
                </div>
                <Link
                    href="/dashboard/courses/new"
                    className="flex items-center gap-2 h-11 px-6 rounded-lg bg-[#137fec] text-white font-bold transition-all hover:bg-[#137fec]/80"
                >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
                    </svg>
                    <span>Create Course</span>
                </Link>
            </header>

            {/* Courses Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {courses && courses.length > 0 ? (
                    courses.map((course) => {
                        const isCompleted = progressMap.get(course.id) || false
                        const isEnrolled = progressMap.has(course.id)

                        return (
                            <Link
                                key={course.id}
                                href={`/dashboard/courses/${course.id}`}
                                className="group bg-[#1a232e] rounded-xl overflow-hidden border border-[#3b4754] hover:border-[#137fec]/50 transition-all cursor-pointer"
                            >
                                {/* Thumbnail */}
                                <div className="h-40 bg-gradient-to-br from-[#137fec]/20 to-[#137fec]/5 relative overflow-hidden">
                                    {course.thumbnail_url ? (
                                        <Image
                                            src={course.thumbnail_url}
                                            alt={course.title}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <svg className="w-16 h-16 text-[#137fec]/30" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                            </svg>
                                        </div>
                                    )}

                                    {/* Status Badge */}
                                    {isCompleted && (
                                        <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            Completed
                                        </div>
                                    )}
                                    {!isCompleted && isEnrolled && (
                                        <div className="absolute top-2 right-2 bg-[#137fec] text-white px-3 py-1 rounded-full text-xs font-bold">
                                            In Progress
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-5 flex flex-col gap-3">
                                    <h4 className="font-bold text-base line-clamp-2 text-white group-hover:text-[#137fec] transition-colors">
                                        {course.title}
                                    </h4>

                                    {course.summary && (
                                        <p className="text-[#9dabb9] text-sm line-clamp-2">
                                            {course.summary}
                                        </p>
                                    )}

                                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#3b4754]">
                                        <div className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-[#137fec]" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                            </svg>
                                            <span className="text-[#9dabb9] text-xs font-medium">{course.xp_reward} XP</span>
                                        </div>

                                        {course.organizations && course.organizations.length > 0 && (
                                            <span className="text-[#9dabb9] text-xs">{course.organizations[0].name}</span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        )
                    })
                ) : (
                    <div className="col-span-full bg-[#1a232e] rounded-xl border border-[#3b4754] p-12 text-center">
                        <svg className="w-16 h-16 text-[#3b4754] mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm0 4c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm6 12H6v-1.4c0-2 4-3.1 6-3.1s6 1.1 6 3.1V19z" />
                        </svg>
                        <p className="text-[#9dabb9] text-lg mb-2">No courses available</p>
                        <p className="text-[#9dabb9] text-sm mb-4">Be the first to create a course</p>
                        <Link
                            href="/dashboard/courses/new"
                            className="inline-block bg-[#137fec] hover:bg-[#137fec]/80 text-white px-6 py-2 rounded-lg font-bold text-sm transition-colors"
                        >
                            Create Course
                        </Link>
                    </div>
                )}
            </div>
        </>
    )
}
