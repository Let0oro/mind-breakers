import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { CardQuest } from '@/components/ui/CardQuest'
import { CardExpedition } from '@/components/ui/CardExpedition'
import { getUserLibraryData } from '@/lib/queries'

export const metadata = {
    title: 'Archives - MindBreaker',
    description: 'Your personal learning history and library',
}

// Section component extracted outside of render
function Section({
    title,
    icon,
    href,
    count,
    children,
    emptyMessage,
    createHref,
    createLabel
}: {
    title: string
    icon: string
    href: string
    count: number
    children: React.ReactNode
    emptyMessage: string
    createHref?: string
    createLabel?: string
}) {
    return (
        <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-muted">{icon}</span>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-text-main">
                        {title}
                    </h2>
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-surface text-muted">
                        {count}
                    </span>
                </div>
                <div className="flex items-center gap-10">
                    {createHref && (
                        <Link
                            href={createHref}
                            className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-muted hover:text-text-main transition-colors"
                        >
                            <span className="material-symbols-outlined text-sm">add</span>
                            {createLabel || 'Create'}
                        </Link>
                    )}
                    <Link
                        href={href}
                        className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-muted hover:text-text-main transition-colors"
                    >
                        View All
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                </div>
            </div>
            {count > 0 ? children : (
                <div className="border border-border bg-main p-8 text-center">
                    <p className="text-muted text-sm">{emptyMessage}</p>
                </div>
            )}
        </section>
    )
}

export default async function LibraryPage() {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) redirect('/login')

    // Fetch all library data using centralized query function
    const libraryData = await getUserLibraryData(supabase, user.id, {
        drafts: 100,
        quests: 100,
        expeditions: 100,
        organizations: 12
    })

    const { drafts, quests, expeditions, organizations, savedExpeditionIds } = libraryData

    return (
        <>
            <header className="mb-10 flex items-end justify-between">
                <div>
                    <h1 className="text-5xl font-header text-foreground tracking-tight mb-1">
                        Archives
                    </h1>
                    <p className="text-muted text-sm">
                        Your personal learning history and library
                    </p>
                </div>
            </header>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
                <div className="border border-border bg-main p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted mb-1">Quests</p>
                    <p className="text-3xl font-black text-text-main">{quests.length}</p>
                </div>
                <div className="border border-border bg-main p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted mb-1">Expeditions</p>
                    <p className="text-3xl font-black text-text-main">{expeditions.length}</p>
                </div>
                <div className="border border-border bg-main p-4 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gold mb-1 flex items-center gap-2">
                        Pending Drafts
                        {drafts.length > 0 && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-gold"></span></span>}
                    </p>
                    <p className="text-3xl font-black text-text-main">{drafts.length}</p>
                </div>
            </div>

            {/* --- ACTION REQUIRED: DRAFTS --- */}
            <div className="mb-12 border-b border-border pb-6">
                <Section
                    title="Action Required: My Drafts"
                    icon="edit_note"
                    href="/guild-hall/drafts"
                    count={drafts.length}
                    emptyMessage="No drafts. Everything is published or you haven't started creating yet!"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {drafts.map((draft) => (
                            <div key={draft.id} className="relative">
                                {/* Visual indicator matching sidebar notification */}
                                <div className="absolute -top-1 -right-1 z-10 animate-pulse w-3 h-3 bg-gold rounded-full border-2 border-main border-solid shadow-[0_0_8px_rgba(212,175,55,0.5)]"></div>
                                <CardQuest
                                    id={draft.id}
                                    title={draft.title}
                                    thumbnail_url={draft.thumbnail_url}
                                    xp_reward={draft.xp_reward}
                                    summary={draft.summary || undefined}
                                    status={draft.status}
                                    variant="draft"
                                    href={`/guild-hall/drafts/${draft.id}/edit`}
                                />
                            </div>
                        ))}
                    </div>
                </Section>
            </div>

            <div className="mb-6 flex items-center gap-2 text-muted">
                <span className="material-symbols-outlined">library_books</span>
                <h3 className="text-xs font-bold uppercase tracking-widest">Published Library & History</h3>
            </div>



            {/* Quests Section */}
            <Section
                title="My Quests"
                icon="school"
                href="/guild-hall/quests"
                count={quests.length}
                createHref="/guild-hall/quests/new"
                createLabel="New"
                emptyMessage="No quests yet. Explore and enroll in some!"
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {quests.map((quest) => (
                        <CardQuest
                            key={quest.id}
                            id={quest.id}
                            title={quest.title}
                            thumbnail_url={quest.thumbnail_url}
                            xp_reward={quest.xp_reward}
                            summary={quest.summary}
                            status={quest.status}
                            instructor={quest.organizations?.[0]?.name}
                            variant="grid"
                        />
                    ))}
                </div>
            </Section>

            {/* Expeditions Section */}
            <Section
                title="My expeditions"
                icon="route"
                href="/guild-hall/expeditions"
                count={expeditions.length}
                emptyMessage="No expeditions saved. Discover expeditions!"
                createHref="/guild-hall/expeditions/new"
                createLabel="New"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {expeditions.map((expedition) => {
                        const questCount = expedition.quests?.length || 0
                        const expeditionQuestIds = new Set(expedition.quests?.map(q => q.id) || [])
                        const completedQuestsCount = quests.filter(q =>
                            expeditionQuestIds.has(q.id) &&
                            q.user_quest_progress?.[0]?.completed
                        ).length

                        const progressPercent = questCount > 0 ? (completedQuestsCount / questCount) * 100 : 0
                        const org = Array.isArray(expedition.organizations) ? expedition.organizations[0] : expedition.organizations

                        return (
                            <CardExpedition
                                key={expedition.id}
                                id={expedition.id}
                                title={expedition.title}
                                summary={expedition.summary}
                                completedQuests={completedQuestsCount}
                                totalQuests={questCount}
                                progressPercent={progressPercent}
                                isSaved={savedExpeditionIds.has(expedition.id)}
                                isValidated={expedition.is_validated}
                                isOwner={expedition.created_by === user.id}
                                organizationName={org?.name}
                                variant="card"
                            />
                        )
                    })}
                </div>
            </Section>

            {/* Organizations Section */}
            <Section
                title="Organizations"
                icon="corporate_fare"
                href="/guild-hall/organizations"
                count={organizations.length}
                emptyMessage="No organizations found."
                createHref="/guild-hall/organizations/new"
                createLabel="New"
            >
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {organizations.map((org) => (
                        <Link
                            key={org.id}
                            href={`/guild-hall/expeditions?org=${org.id}`}
                            className="border border-border bg-main p-4 hover:border-text-main transition-colors group"
                        >
                            <div className="w-10 h-10 border border-border flex items-center justify-center mb-3">
                                <span className="text-lg font-bold text-text-main">
                                    {org.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <h3 className="text-sm font-bold text-text-main truncate group-hover:underline">
                                {org.name}
                            </h3>
                            {!org.is_validated && (
                                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">
                                    Pending
                                </span>
                            )}
                        </Link>
                    ))}
                </div>
            </Section>


        </>
    )
}
