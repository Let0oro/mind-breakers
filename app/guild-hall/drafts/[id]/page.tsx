import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export default async function DraftDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id } = await params

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Fetch the draft quest
    const { data: quest, error } = await supabase
        .from('quests')
        .select(`
            *,
            expeditions (id, title),
            organizations (name, website_url),
            quest_exercises (*)
        `)
        .eq('id', id)
        .eq('created_by', user.id)
        .eq('status', 'draft')
        .single()

    if (error || !quest) notFound()

    return (
        <>
            {/* Draft Banner */}
            <div className="mb-6 rounded-xl border-2 border-yellow-500/50 bg-yellow-500/10 p-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-yellow-500">edit_document</span>
                    <div>
                        <p className="font-medium text-yellow-500">Draft</p>
                        <p className="text-sm text-yellow-500/70">
                            This quest is not published yet. Only you can see it.
                        </p>
                    </div>
                </div>
                <Link
                    href={`/guild-hall/drafts/${quest.id}/edit`}
                    className="px-4 py-2 rounded-lg bg-yellow-500 text-text-main font-bold hover:bg-yellow-600 transition-colors flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    Continue Editing
                </Link>
            </div>

            {/* Header */}
            <header className="mb-8">
                <Link
                    href="/guild-hall/drafts"
                    className="text-sm text-muted dark:text-muted hover:text-brand mb-4 inline-flex items-center gap-1 transition-colors"
                >
                    <span className="material-symbols-outlined text-base">arrow_back</span>
                    Back to Drafts
                </Link>

                <div className="flex lg:items-end text-center sm:text-left lg:justify-between mt-2 lg:gap-4 flex-wrap-reverse justify-center items-center gap-8">
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-text-main dark:text-text-main flex items-center gap-3">
                            {quest.title}
                            <span className="inline-flex items-center rounded-md bg-yellow-50 dark:bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-800 dark:text-yellow-400 ring-1 ring-inset ring-yellow-600/20">
                                Draft
                            </span>
                        </h1>
                        {quest.summary && (
                            <p className="mt-2 text-lg text-muted dark:text-muted">
                                {quest.summary}
                            </p>
                        )}
                        <div className="mt-3 flex items-center gap-4 text-sm text-muted dark:text-muted">
                            {quest.organizations && (
                                <span>📚 {quest.organizations.name}</span>
                            )}
                            <span className="text-brand">⚡ {quest.xp_reward} XP</span>
                            {quest.quest_exercises?.length > 0 && (
                                <span>✍️ {quest.quest_exercises.length} mission(s)</span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href={`/guild-hall/drafts/${quest.id}/edit`}
                            className="rounded-lg bg-brand px-6 py-3 text-text-main font-bold hover:bg-brand/90 transition-colors flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-sm">edit</span>
                            Edit Draft
                        </Link>
                    </div>
                </div>
            </header>

            {/* Content Preview */}
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    {/* Description */}
                    <div className="rounded-xl bg-main dark:bg-surface p-6 border border-border dark:border-border">
                        <h2 className="text-lg font-semibold text-text-main dark:text-text-main mb-4">
                            Description
                        </h2>
                        {quest.description ? (
                            <div className="prose prose-sm prose-invert max-w-none text-muted dark:text-muted">
                                <p className="whitespace-pre-wrap">{quest.description}</p>
                            </div>
                        ) : (
                            <p className="text-sm text-muted dark:text-muted/70 italic">
                                No description. Add one in the editor.
                            </p>
                        )}
                    </div>

                    {/* Exercises Preview */}
                    {quest.quest_exercises && quest.quest_exercises.length > 0 && (
                        <div className="rounded-xl bg-main dark:bg-surface p-6 border border-border dark:border-border">
                            <h2 className="text-lg font-semibold text-text-main dark:text-text-main mb-4">
                                Missions ({quest.quest_exercises.length})
                            </h2>
                            <div className="space-y-3">
                                {quest.quest_exercises.map((ex: { id: string; title: string }, i: number) => (
                                    <div key={ex.id} className="p-3 rounded-lg bg-surface dark:bg-sidebar border border-border dark:border-border">
                                        <span className="text-sm font-medium text-text-main dark:text-text-main">
                                            {i + 1}. {ex.title || 'Sin título'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Info */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="rounded-xl bg-main dark:bg-surface p-6 border border-border dark:border-border">
                        <h3 className="text-sm font-semibold text-text-main dark:text-text-main mb-4">
                            Draft Information
                        </h3>
                        <dl className="space-y-3 text-sm">
                            {quest.expeditions && (
                                <div>
                                    <dt className="text-muted dark:text-muted">Expedition</dt>
                                    <dd className="mt-1 font-medium text-text-main dark:text-text-main">
                                        {quest.expeditions.title}
                                    </dd>
                                </div>
                            )}
                            <div>
                                <dt className="text-muted dark:text-muted">XP Reward</dt>
                                <dd className="mt-1 font-medium text-brand">
                                    {quest.xp_reward} XP
                                </dd>
                            </div>
                            <div>
                                <dt className="text-muted dark:text-muted">Status</dt>
                                <dd className="mt-1 font-medium text-yellow-500">
                                    Draft (not published)
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
        </>
    )
}
