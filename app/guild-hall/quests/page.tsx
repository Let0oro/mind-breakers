import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { CardQuest } from '@/components/ui/CardQuest'
import {
    getUserSavedQuestsCached,
    getUserProgressCached,
    getUserCreatedQuestIdsCached,
    getQuestsByIdsCached
} from '@/lib/cache'

export const metadata = {
    title: 'Quests - MindBreaker',
    description: 'Browse and enroll in quests',
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
    user_quest_progress: { completed: boolean, xp_earned: number }[]
    saved_quests: { user_id: string }[]
}

export default async function QuestsPage({
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
    const [savedQuestIds, userProgress, createdQuestIds] = await Promise.all([
        getUserSavedQuestsCached(supabase, user.id),
        getUserProgressCached(supabase, user.id),
        getUserCreatedQuestIdsCached(supabase, user.id)
    ])

    const progressQuestIds = userProgress.map(c => c.quest_id)

    // Combine all quest IDs
    const questIds = [...new Set([
        ...createdQuestIds,
        ...progressQuestIds,
        ...savedQuestIds
    ])]

    // Fetch quests by IDs (cached)
    let quests = (await getQuestsByIdsCached(supabase, user.id, questIds)) as QuestItem[]

    const allQuestsCount = quests.length
    if (filter !== 'all') {
        quests = quests.filter(quest => {
            if (filter === 'pending') return quest.is_validated === false && quest.status !== 'draft'
            if (filter === 'published') return quest.status === 'published' && quest.is_validated === true
            if (filter === 'draft') return quest.status === 'draft'
            if (filter === 'archived') return quest.status === 'archived'
            return true
        })
    }

    const creatorIds = Array.from(new Set(quests.map(c => c.created_by).filter(Boolean)))
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

    const progressMap = new Map(userProgress.map(p => [p.quest_id, p.completed]))
    const savedSet = new Set(savedQuestIds)

    const tabs = [
        { key: 'all', label: 'ALL', href: '/guild-hall/quests' },
        { key: 'published', label: 'PUBLISHED', href: '/guild-hall/quests?filter=published' },
        { key: 'pending', label: 'PENDING', href: '/guild-hall/quests?filter=pending' },
        { key: 'draft', label: 'DRAFTS', href: '/guild-hall/quests?filter=draft' },
        { key: 'archived', label: 'ARCHIVED', href: '/guild-hall/quests?filter=archived' },
    ]

    return (
        <>
            {/* Header */}
            <header className="mb-10">
                <div className="flex flex-wrap justify-between items-end gap-6 mb-6">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-5xl font-header text-foreground tracking-tight">QUESTS</h1>
                        <p className="text-muted text-sm">
                            {quests.length} / {allQuestsCount} quests displayed
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link
                            href="/guild-hall/world-map"
                            className="flex items-center gap-2 px-4 py-2 border border-border text-xs font-bold uppercase tracking-widest text-muted hover:border-text-main hover:text-text-main transition-all"
                        >
                            <span className="material-symbols-outlined text-lg">search</span>
                            <span>Explore</span>
                        </Link>
                        <Link
                            href="/guild-hall/quests/new"
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

            {/* Quests Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {quests.length > 0 ? (
                    quests.map((quest) => {
                        const isCompleted = progressMap.get(quest.id) || false
                        const isEnrolled = progressMap.has(quest.id)
                        const isSaved = savedSet.has(quest.id)

                        const isPublished = quest.status === 'published'
                        const isPending = isPublished && !quest.is_validated

                        return (
                            <CardQuest
                                key={quest.id}
                                id={quest.id}
                                title={quest.title}
                                thumbnail_url={quest.thumbnail_url}
                                xp_reward={quest.xp_reward}
                                summary={quest.summary}
                                status={isPending ? 'pending' : quest.status}
                                progress={isEnrolled ? (isCompleted ? 100 : 10) : 0}
                                isSaved={isSaved}
                                instructor={quest.organizations && quest.organizations.length > 0 ? quest.organizations[0].name : (creatorMap.get(quest.created_by) ? `by ${creatorMap.get(quest.created_by)}` : undefined)}
                                variant="grid"
                            />
                        )
                    })
                ) : (
                    <div className="col-span-full border border-border p-12 text-center">
                        <span className="material-symbols-outlined text-5xl text-muted mb-4 block">assignment_late</span>
                        <p className="text-muted text-sm mb-1">No quests found</p>
                        <p className="text-muted text-xs mb-6">
                            {filter !== 'all' ? `No ${filter} quests.` : "Start by exploring or creating a quest."}
                        </p>
                        <Link
                            href="/guild-hall/world-map"
                            className="inline-block px-4 py-2 border border-text-main text-text-main text-xs font-bold uppercase tracking-widest hover:bg-inverse hover:text-main-alt transition-all"
                        >
                            Explore Quests
                        </Link>
                    </div>
                )}
            </div>
        </>
    )
}
