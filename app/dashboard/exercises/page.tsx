import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { ExerciseList } from '@/components/ExerciseList'

export const metadata = {
    title: 'My Exercises - MindBreaker',
    description: 'Track your exercise progress and submissions',
}

interface PageProps {
    searchParams?: {
        filter?: 'all' | 'completed' | 'in_progress' | 'pending_review'
    }
}

export default async function ExercisesPage({ searchParams }: PageProps) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const filter = searchParams?.filter || 'all'

    // Fetch all exercises from courses the user is enrolled in
    // First get enrolled course IDs
    const { data: enrolledCourses } = await supabase
        .from('user_course_progress')
        .select('course_id')
        .eq('user_id', user.id)

    const enrolledCourseIds = enrolledCourses?.map(c => c.course_id) || []

    // Fetch exercises for these courses
    let exercisesQuery = supabase
        .from('course_exercises')
        .select(`
      id,
      title,
      description,
      courses (id, title)
    `)
        .in('course_id', enrolledCourseIds)

    const { data: exercises } = await exercisesQuery

    // Fetch user submissions for these exercises
    const { data: submissions } = await supabase
        .from('exercise_submissions')
        .select('exercise_id, status, created_at')
        .eq('user_id', user.id)

    const submissionMap = new Map(submissions?.map(s => [s.exercise_id, s]) || [])

    // Process data for display
    const exerciseList = exercises?.map(ex => {
        const submission = submissionMap.get(ex.id)
        let status: 'completed' | 'in_progress' | 'pending_review' | 'not_started' = 'not_started'

        if (submission) {
            if (submission.status === 'approved') status = 'completed'
            else if (submission.status === 'pending') status = 'pending_review'
            else status = 'in_progress' // rejected or drafts if we had them
        }

        return {
            id: ex.id,
            title: ex.title,
            description: ex.description,
            status,
            // Assuming generic XP reward for exercises since it's not in the exercise table directly (based on explored schema)
            // or we could fetch it if it exists. Re-checking types... schema showed course_exercises doesn't have xp_reward but course does.
            // Let's use a default or update if schema has it.
            xp_reward: 50,
            course_title: Array.isArray(ex.courses) ? ex.courses[0]?.title : (ex.courses as any)?.title,
            course_id: Array.isArray(ex.courses) ? ex.courses[0]?.id : (ex.courses as any)?.id,
            submitted_at: submission?.created_at
        }
    }) || []

    // Apply filter
    const filteredExercises = exerciseList.filter(ex => {
        if (filter === 'all') return true
        if (filter === 'completed') return ex.status === 'completed'
        if (filter === 'pending_review') return ex.status === 'pending_review'
        if (filter === 'in_progress') return ex.status === 'in_progress' || ex.status === 'not_started'
        return true
    })

    // Sort: Pending review first, then Not Started (todo), then Completed
    filteredExercises.sort((a, b) => {
        const score = (status: string) => {
            if (status === 'pending_review') return 0
            if (status === 'not_started') return 1
            if (status === 'in_progress') return 2
            return 3
        }
        return score(a.status) - score(b.status)
    })

    return (
        <>
            <header className="mb-8">
                <h2 className="text-white text-3xl font-black tracking-tight mb-2">My Exercises</h2>
                <p className="text-[#9dabb9] text-base mb-6">
                    Practice and apply what you've learned
                </p>

                {/* Filter Tabs */}
                <div className="flex gap-2 border-b border-[#3b4754]">
                    {[
                        { key: 'all', label: 'All Exercises' },
                        { key: 'in_progress', label: 'To Do' },
                        { key: 'pending_review', label: 'Under Review' },
                        { key: 'completed', label: 'Completed' },
                    ].map((tab) => (
                        <a
                            key={tab.key}
                            href={`/dashboard/exercises?filter=${tab.key}`}
                            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${filter === tab.key
                                ? 'border-[#137fec] text-[#137fec]'
                                : 'border-transparent text-[#9dabb9] hover:text-white'
                                }`}
                        >
                            {tab.label}
                        </a>
                    ))}
                </div>
            </header>

            <ExerciseList exercises={filteredExercises} />
        </>
    )
}
