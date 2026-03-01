import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { MissionList } from '@/components/features/MissionList'

export const metadata = {
    title: 'My Missions - MindBreaker',
    description: 'Track your mission progress and submissions',
}

interface PageProps {
    searchParams: Promise<{
        filter?: 'all' | 'completed' | 'in_progress' | 'pending_review'
    }>
}

export default async function MissionsPage({ searchParams }: PageProps) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const resolvedSearchParams = await searchParams
    const filter = resolvedSearchParams?.filter || 'all'

    // Fetch missions relevant to the user
    const { data: enrolledQuests } = await supabase
        .from('user_quest_progress')
        .select('quest_id')
        .eq('user_id', user.id)

    const { data: createdQuests } = await supabase
        .from('quests')
        .select('id')
        .eq('created_by', user.id)

    const relevantQuestIds = new Set([
        ...(enrolledQuests?.map(c => c.quest_id) || []),
        ...(createdQuests?.map(c => c.id) || [])
    ])

    const missionsQuery = supabase
        .from('quest_missions')
        .select(`
            id,
            title,
            description,
            quests (id, title)
        `)
        .in('quest_id', Array.from(relevantQuestIds))

    const { data: missions } = await missionsQuery

    const { data: submissions } = await supabase
        .from('mission_submissions')
        .select('mission_id, status, created_at')
        .eq('user_id', user.id)

    const submissionMap = new Map(submissions?.map(s => [s.mission_id, s]) || [])

    const missionList = missions?.map(ex => {
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
            quest_title: Array.isArray(ex.quests) ? ex.quests[0]?.title : (ex.quests as { title: string })?.title,
            quest_id: Array.isArray(ex.quests) ? ex.quests[0]?.id : (ex.quests as { id: string })?.id,
            submitted_at: submission?.created_at
        }
    }) || []

    const filteredMissions = missionList.filter(ex => {
        if (filter === 'all') return true
        if (filter === 'completed') return ex.status === 'completed'
        if (filter === 'pending_review') return ex.status === 'pending_review'
        if (filter === 'in_progress') return ex.status === 'in_progress' || ex.status === 'not_started'
        return true
    })

    filteredMissions.sort((a, b) => {
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

            <MissionList missions={filteredMissions} />
        </>
    )
}
