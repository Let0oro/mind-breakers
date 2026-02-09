import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { ExerciseList } from '@/components/features/ExerciseList'

export const metadata = {
    title: 'My Exercises - MindBreaker',
    description: 'Track your exercise progress and submissions',
}

interface PageProps {
    searchParams: Promise<{
        filter?: 'all' | 'completed' | 'in_progress' | 'pending_review'
    }>
}

export default async function ExercisesPage({ searchParams }: PageProps) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const resolvedSearchParams = await searchParams
    const filter = resolvedSearchParams?.filter || 'all'

    // Fetch exercises relevant to the user
    const { data: enrolledCourses } = await supabase
        .from('user_course_progress')
        .select('course_id')
        .eq('user_id', user.id)

    const { data: createdCourses } = await supabase
        .from('courses')
        .select('id')
        .eq('created_by', user.id)

    const relevantCourseIds = new Set([
        ...(enrolledCourses?.map(c => c.course_id) || []),
        ...(createdCourses?.map(c => c.id) || [])
    ])

    const exercisesQuery = supabase
        .from('course_exercises')
        .select(`
            id,
            title,
            description,
            courses (id, title)
        `)
        .in('course_id', Array.from(relevantCourseIds))

    const { data: exercises } = await exercisesQuery

    const { data: submissions } = await supabase
        .from('exercise_submissions')
        .select('exercise_id, status, created_at')
        .eq('user_id', user.id)

    const submissionMap = new Map(submissions?.map(s => [s.exercise_id, s]) || [])

    const exerciseList = exercises?.map(ex => {
        const submission = submissionMap.get(ex.id)
        let status: 'completed' | 'in_progress' | 'pending_review' | 'not_started' = 'not_started'

        if (submission) {
            if (submission.status === 'approved') status = 'completed'
            else if (submission.status === 'pending') status = 'pending_review'
            else status = 'in_progress'
        }

        return {
            id: ex.id,
            title: ex.title,
            description: ex.description,
            status,
            xp_reward: 50,
            course_title: Array.isArray(ex.courses) ? ex.courses[0]?.title : (ex.courses as { title: string })?.title,
            course_id: Array.isArray(ex.courses) ? ex.courses[0]?.id : (ex.courses as { id: string })?.id,
            submitted_at: submission?.created_at
        }
    }) || []

    const filteredExercises = exerciseList.filter(ex => {
        if (filter === 'all') return true
        if (filter === 'completed') return ex.status === 'completed'
        if (filter === 'pending_review') return ex.status === 'pending_review'
        if (filter === 'in_progress') return ex.status === 'in_progress' || ex.status === 'not_started'
        return true
    })

    filteredExercises.sort((a, b) => {
        const score = (status: string) => {
            if (status === 'pending_review') return 0
            if (status === 'not_started') return 1
            if (status === 'in_progress') return 2
            return 3
        }
        return score(a.status) - score(b.status)
    })

    const tabs = [
        { key: 'all', label: 'All' },
        { key: 'in_progress', label: 'To Do' },
        { key: 'pending_review', label: 'Under Review' },
        { key: 'completed', label: 'Completed' },
    ]

    return (
        <>
            <header className="mb-8">
                <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tight text-text-main mb-1">
                    Missions
                </h1>
                <p className="text-muted text-sm">
                    Practice and apply what you&apos;ve learned
                </p>
            </header>

            {/* Filter Tabs */}
            <div className="flex gap-6 border-b border-border mb-8">
                {tabs.map((tab) => (
                    <a
                        key={tab.key}
                        href={`/guild-hall/missions?filter=${tab.key}`}
                        className={`pb-3 text-xs font-bold uppercase tracking-widest transition-colors border-b-2 -mb-px ${filter === tab.key
                            ? 'border-text-main text-text-main'
                            : 'border-transparent text-muted hover:text-text-main'
                            }`}
                    >
                        {tab.label}
                    </a>
                ))}
            </div>

            <ExerciseList exercises={filteredExercises} />
        </>
    )
}
