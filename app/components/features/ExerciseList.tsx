import Link from 'next/link'

interface Exercise {
    id: string
    title: string
    description?: string
    status: 'completed' | 'in_progress' | 'pending_review' | 'not_started'
    xp_reward?: number
    course_title?: string
    course_id?: string
    submitted_at?: string
}

export function ExerciseList({ exercises }: { exercises: Exercise[] }) {
    if (!exercises.length) {
        return (
            <div className="bg-white dark:bg-[#1a232e] rounded-xl border border-gray-200 dark:border-sidebar-border p-12 text-center">
                <span className="material-symbols-outlined text-6xl text-[#3b4754] mb-4 block">
                    assignment
                </span>
                <p className="text-gray-600 dark:text-muted-foreground text-lg mb-2">No exercises found</p>
                <p className="text-gray-600 dark:text-muted-foreground text-sm">
                    Enroll in courses to find new exercises
                </p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 gap-4">
            {exercises.map((exercise) => (
                <div
                    key={exercise.id}
                    className="group bg-white dark:bg-[#1a232e] rounded-xl border border-gray-200 dark:border-sidebar-border p-6 flex flex-col md:flex-row gap-6 md:items-center hover:border-brand/50 transition-all"
                >
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${exercise.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                                    exercise.status === 'in_progress' ? 'bg-blue-500/20 text-blue-500' :
                                        exercise.status === 'pending_review' ? 'bg-yellow-500/20 text-yellow-500' :
                                            'bg-gray-500/20 text-gray-500'
                                }`}>
                                {exercise.status.replace('_', ' ')}
                            </span>
                            {exercise.course_title && (
                                <span className="text-gray-600 dark:text-muted-foreground text-xs">
                                    in {exercise.course_title}
                                </span>
                            )}
                        </div>

                        <h3 className="text-gray-900 dark:text-white font-bold text-lg mb-2 group-hover:text-brand transition-colors">
                            {exercise.title}
                        </h3>

                        {exercise.description && (
                            <p className="text-gray-600 dark:text-muted-foreground text-sm line-clamp-2">
                                {exercise.description}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-4 md:border-l md:border-gray-200 dark:border-sidebar-border md:pl-6">
                        {exercise.xp_reward && (
                            <div className="flex items-center gap-1 text-brand font-bold whitespace-nowrap">
                                <span className="material-symbols-outlined text-sm">star</span>
                                <span>{exercise.xp_reward} XP</span>
                            </div>
                        )}

                        <Link
                            href={`/dashboard/exercises/${exercise.id}/submit`}
                            className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors whitespace-nowrap ${exercise.status === 'completed' || exercise.status === 'pending_review'
                                    ? 'bg-[#283039] text-gray-900 dark:text-white hover:bg-sidebar-border'
                                    : 'bg-brand text-gray-900 dark:text-white hover:bg-brand/80'
                                }`}
                        >
                            {exercise.status === 'completed' ? 'View Submission' :
                                exercise.status === 'pending_review' ? 'View Status' :
                                    'Start Exercise'}
                        </Link>
                    </div>
                </div>
            ))}
        </div>
    )
}
