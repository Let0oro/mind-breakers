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
                    <span className="material-symbols-outlined w-5 h-5">add_circle</span>
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
                                            <span className="material-symbols-outlined w-16 h-16 text-[#137fec]/30">school</span>
                                        </div>
                                    )}

                                    {/* Status Badge */}
                                    {isCompleted && (
                                        <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                            <span className="material-symbols-outlined w-3 h-3">check</span>
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
                                            <span className="material-symbols-outlined w-4 h-4 text-[#137fec]">star</span>
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
                        <span className="material-symbols-outlined w-16 h-16 text-[#3b4754] mx-auto mb-4">school</span>
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
