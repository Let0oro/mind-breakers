import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export const metadata = {
    title: 'My Drafts - MindBreaker',
    description: 'Manage your course drafts',
}

export default async function DraftsPage() {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) redirect('/login')

    // Fetch drafts created by user
    const { data: drafts } = await supabase
        .from('courses')
        .select(`
            id,
            title,
            summary,
            thumbnail_url,
            xp_reward,
            status,
            created_by,
            organizations (name),
            created_at
        `)
        .eq('created_by', user.id)
        .or('status.eq.draft,status.eq.pending')
        .order('created_at', { ascending: false })

    return (
        <>
            {/* Header Section */}
            <header className="flex flex-col gap-6 mb-8">
                <div className="flex flex-wrap justify-between items-end gap-6">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-text-main dark:text-text-main text-3xl font-black tracking-tight">My Drafts</h2>
                        <p className="text-muted dark:text-muted text-base">
                            You have {drafts?.length || 0} drafts in progress. Keep creating!
                        </p>
                    </div>
                    <Link
                        href="/dashboard/quests/new"
                        className="flex items-center gap-2 h-11 px-6 rounded-lg bg-brand text-text-main dark:text-text-main font-bold transition-all hover:bg-brand/80"
                    >
                        <span className="material-symbols-outlined w-5 h-5">add_circle</span>
                        <span>Create New Draft</span>
                    </Link>
                </div>
            </header>

            {/* Drafts Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {drafts && drafts.length > 0 ? (
                    drafts.map((course) => (
                        <div
                            key={course.id}
                            className="group bg-main dark:bg-surface rounded-xl overflow-hidden border border-border dark:border-border flex flex-col relative transition-all hover:border-brand/50"
                        >
                            {/* Thumbnail */}
                            <div className="h-40 bg-gradient-to-br from-ring/20 to-ring/5 relative overflow-hidden shrink-0">
                                {course.thumbnail_url ? (
                                    <img
                                        src={course.thumbnail_url}
                                        alt={course.title}
                                        className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-opacity"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="material-symbols-outlined w-16 h-16 text-brand/30">edit_document</span>
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 flex flex-col gap-2 items-end">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-yellow-100 text-yellow-800">
                                        Draft
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-5 flex flex-col gap-3 flex-1">
                                <h4 className="font-bold text-lg line-clamp-1 text-text-main dark:text-text-main">
                                    {course.title}
                                </h4>

                                {course.summary ? (
                                    <p className="text-muted dark:text-muted text-sm line-clamp-2 mb-2">
                                        {course.summary}
                                    </p>
                                ) : (
                                    <p className="text-muted dark:text-muted/70 text-sm italic mb-2">
                                        No summary provided.
                                    </p>
                                )}

                                <div className="mt-auto grid grid-cols-2 gap-3">
                                    <Link
                                        href={`/dashboard/quests/${course.id}`}
                                        className="flex items-center justify-center gap-2 h-10 rounded-lg border border-border dark:border-border text-text-main dark:text-muted font-medium text-sm hover:bg-surface dark:hover:bg-surface-dark transition-colors"
                                    >
                                        <span className="material-symbols-outlined w-4 h-4">visibility</span>
                                        Preview
                                    </Link>
                                    <Link
                                        href={`/dashboard/quests/${course.id}/edit`}
                                        className="flex items-center justify-center gap-2 h-10 rounded-lg bg-brand/10 text-brand font-bold text-sm hover:bg-brand/20 transition-colors"
                                    >
                                        <span className="material-symbols-outlined w-4 h-4">edit</span>
                                        Edit
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full bg-main dark:bg-surface rounded-xl border border-border dark:border-border p-12 text-center">
                        <span className="material-symbols-outlined w-16 h-16 text-muted mx-auto mb-4">post_add</span>
                        <p className="text-muted dark:text-muted text-lg mb-2">No drafts found</p>
                        <p className="text-muted dark:text-muted text-sm mb-4">
                            You haven&apos;t created any drafts yet.
                        </p>
                        <Link
                            href="/dashboard/quests/new"
                            className="inline-block bg-brand hover:bg-brand/80 text-text-main dark:text-text-main px-6 py-2 rounded-lg font-bold text-sm transition-colors"
                        >
                            Start a New Course
                        </Link>
                    </div>
                )}
            </div>
        </>
    )
}
