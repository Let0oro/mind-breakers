import Link from 'next/link'

interface Mission {
    id: string
    title: string
    description?: string
    status: 'completed' | 'in_progress' | 'pending_review' | 'not_started'
    xp_reward?: number
    quest_title?: string
    quest_id?: string
    submitted_at?: string
}

export function MissionList({ missions }: { missions: Mission[] }) {
    if (!missions.length) {
        return (
            <div className="bg-main  border border-border dark:border-border p-12 text-center">
                <span className="material-symbols-outlined text-6xl text-muted mb-4 block">
                    assignment
                </span>
                <p className="text-muted dark:text-muted text-lg mb-2">No missions found</p>
                <p className="text-muted dark:text-muted text-sm">
                    Enroll in quests to find new missions
                </p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 gap-4">
            {missions.map((mission) => (
                <div
                    key={mission.id}
                    className="group bg-main  border border-border dark:border-border p-6 flex flex-col md:flex-row gap-6 md:items-center hover:border-brand/50 transition-all"
                >
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider ${mission.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                                mission.status === 'in_progress' ? 'bg-blue-500/20 text-blue-500' :
                                    mission.status === 'pending_review' ? 'bg-yellow-500/20 text-yellow-500' :
                                        'bg-surface/20 text-muted'
                                }`}>
                                {mission.status.replace('_', ' ')}
                            </span>
                            {mission.quest_title && (
                                <span className="text-muted dark:text-muted text-xs">
                                    in {mission.quest_title}
                                </span>
                            )}
                        </div>

                        <h3 className="text-text-main dark:text-text-main font-bold text-lg mb-2 group-hover:text-brand transition-colors">
                            {mission.title}
                        </h3>

                        {mission.description && (
                            <p className="text-muted dark:text-muted text-sm line-clamp-2">
                                {mission.description}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-4 md:border-l md:border-border dark:border-border md:pl-6">
                        {mission.xp_reward && (
                            <div className="flex items-center gap-1 text-brand font-bold whitespace-nowrap">
                                <span className="material-symbols-outlined text-sm">star</span>
                                <span>{mission.xp_reward} XP</span>
                            </div>
                        )}

                        <Link
                            href={`/guild-hall/missions/${mission.id}/submit`}
                            className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors whitespace-nowrap ${mission.status === 'completed' || mission.status === 'pending_review'
                                ? 'bg-surface-dark text-text-main dark:text-text-main hover:bg-border'
                                : 'bg-brand text-text-main dark:text-text-main hover:bg-brand/80'
                                }`}
                        >
                            {mission.status === 'completed' ? 'View Submission' :
                                mission.status === 'pending_review' ? 'View Status' :
                                    'Start Mission'}
                        </Link>
                    </div>
                </div>
            ))}
        </div>
    )
}
